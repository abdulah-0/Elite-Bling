-- ============================================================
-- Swich PayIn Migration: Payment attempts, events, refunds, and state transitions
-- Reference: docs/implementation.prd.md §7
-- ============================================================

-- 7.1 Enums
DO $$ BEGIN
  CREATE TYPE payment_attempt_status AS ENUM (
    'initiated',        -- row created, user not yet redirected
    'redirected',       -- user sent to Swich
    'pending',          -- Swich says pending / queue / otp send
    'paid',
    'failed',           -- failed, block, terminated
    'expired',          -- block/expired or reconciliation timeout
    'disputed',
    'partially_refunded',
    'refunded',
    'needs_review'      -- amount mismatch, late success, inconsistent provider data
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('requested', 'succeeded', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 7.5 Orders: add payment columns if not present
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_payment_ref TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex');

-- 7.2 Payment attempts (one per customerTransactionId)
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                 UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  provider                 TEXT NOT NULL DEFAULT 'swich',
  method                   TEXT NOT NULL DEFAULT 'landing_page',  -- landing_page | ewallet | qr | rtp | bank | biller | card_recurring
  customer_transaction_id  TEXT NOT NULL UNIQUE
                           CHECK (char_length(customer_transaction_id) <= 50),
  swich_order_id           TEXT,                       -- e.g. "SW24106", learned from callback/inquire
  status                   payment_attempt_status NOT NULL DEFAULT 'initiated',
  amount                   NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency                 TEXT NOT NULL DEFAULT 'PKR',
  provider_status          TEXT,                       -- raw Swich status string
  provider_code            TEXT,                       -- raw response code (string!)
  provider_message         TEXT,
  payment_type             TEXT,                       -- from callback PaymentType
  failure_reason           TEXT,
  initiated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  redirected_at            TIMESTAMPTZ,
  completed_at             TIMESTAMPTZ,                -- when paid/failed/expired first set
  last_checked_at          TIMESTAMPTZ,                -- last Inquire
  expires_at               TIMESTAMPTZ NOT NULL,       -- initiated_at + SWICH_ATTEMPT_TTL_MINUTES
  refunded_amount          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id ON public.payment_attempts (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_reconcile ON public.payment_attempts (status, initiated_at)
  WHERE status IN ('initiated', 'redirected', 'pending');

-- 7.3 Append-only event log (callbacks, inquiries, refunds, admin actions)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id              UUID REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  customer_transaction_id TEXT,
  source                  TEXT NOT NULL,        -- callback | inquire | refund | redirect | system | admin
  provider_status         TEXT,
  checksum_valid          BOOLEAN,
  payload                 JSONB NOT NULL,       -- sanitised: no secrets, no tokens
  dedupe_key              TEXT UNIQUE,          -- sha256(source + raw query/body) for idempotent callbacks
  received_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_attempt_received ON public.payment_events (attempt_id, received_at);

-- 7.4 Refunds
CREATE TABLE IF NOT EXISTS public.payment_refunds (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id         UUID NOT NULL REFERENCES public.payment_attempts(id),
  swich_order_id     TEXT NOT NULL,
  amount             NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason             TEXT NOT NULL CHECK (char_length(reason) <= 500),
  status             refund_status NOT NULL DEFAULT 'requested',
  provider_code      TEXT,
  provider_message   TEXT,
  requested_by       UUID,        -- admin user id
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ
);

-- Notification outbox for reliable once-only side effects (§7.7, T1.8)
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type         TEXT NOT NULL,
  order_id           UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  attempt_id         UUID REFERENCES public.payment_attempts(id) ON DELETE SET NULL,
  payload            JSONB NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending',
  error              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON public.notification_outbox (status, created_at);

-- 7.6 Row Level Security (RLS)
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- Owner read-only policy for attempts
DO $$ BEGIN
  CREATE POLICY "owner can read own attempts" ON public.payment_attempts
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = payment_attempts.order_id
          AND o.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 7.7 Transition function (idempotent, race-safe with row locks)
CREATE OR REPLACE FUNCTION public.apply_payment_status(
  p_customer_transaction_id text,
  p_new_status payment_attempt_status,
  p_provider_status text,
  p_provider_code text,
  p_provider_message text,
  p_swich_order_id text,
  p_amount numeric,
  p_payment_type text default null
) RETURNS TABLE (transitioned boolean, attempt_id uuid, order_id uuid, final_status payment_attempt_status)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.payment_attempts%rowtype;
BEGIN
  SELECT * INTO a FROM public.payment_attempts
   WHERE customer_transaction_id = p_customer_transaction_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 1. Amount guard for success
  IF p_new_status = 'paid' AND p_amount IS NOT NULL AND p_amount <> a.amount THEN
    UPDATE public.payment_attempts
       SET status = 'needs_review',
           failure_reason = 'amount_mismatch',
           updated_at = now()
     WHERE id = a.id;

    UPDATE public.orders
       SET payment_status = 'needs_review'
     WHERE id = a.order_id;

    RETURN QUERY SELECT false, a.id, a.order_id, 'needs_review'::payment_attempt_status;
    RETURN;
  END IF;

  -- 2. Monotonic rules: never leave paid/refunded states for failed/pending/expired
  IF a.status IN ('paid', 'partially_refunded', 'refunded', 'disputed')
     AND p_new_status IN ('initiated', 'redirected', 'pending', 'failed', 'expired') THEN
    RETURN QUERY SELECT false, a.id, a.order_id, a.status;
    RETURN;
  END IF;

  IF a.status = p_new_status THEN
    RETURN QUERY SELECT false, a.id, a.order_id, a.status;
    RETURN;
  END IF;

  -- 3. Late success after expiry/failure => paid but flag for review
  UPDATE public.payment_attempts
     SET status = p_new_status,
         provider_status = p_provider_status,
         provider_code = p_provider_code,
         provider_message = p_provider_message,
         swich_order_id = COALESCE(p_swich_order_id, swich_order_id),
         payment_type = COALESCE(p_payment_type, payment_type),
         completed_at = CASE WHEN p_new_status IN ('paid', 'failed', 'expired') AND completed_at IS NULL THEN now() ELSE completed_at END,
         updated_at = now()
   WHERE id = a.id;

  IF p_new_status = 'paid' THEN
    UPDATE public.orders
       SET payment_status = CASE WHEN a.status IN ('expired', 'failed') THEN 'needs_review' ELSE 'paid' END,
           status = CASE WHEN a.status IN ('expired', 'failed') THEN status ELSE 'paid' END,
           paid_at = COALESCE(paid_at, now())
     WHERE id = a.order_id AND payment_status <> 'paid';

    INSERT INTO public.notification_outbox (event_type, order_id, attempt_id, payload)
    VALUES (
      CASE WHEN a.status IN ('expired', 'failed') THEN 'payment_review_alert' ELSE 'order_paid' END,
      a.order_id,
      a.id,
      jsonb_build_object(
        'customer_transaction_id', p_customer_transaction_id,
        'swich_order_id', COALESCE(p_swich_order_id, a.swich_order_id),
        'amount', a.amount,
        'status', p_new_status
      )
    );

    RETURN QUERY SELECT true, a.id, a.order_id, p_new_status;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, a.id, a.order_id, p_new_status;
END $$;

REVOKE ALL ON FUNCTION public.apply_payment_status FROM PUBLIC, anon, authenticated;
