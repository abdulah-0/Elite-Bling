-- ============================================================
-- Swich PayOut Migration: Payouts, Status Events, Provider Attempts, Balance Snapshots
-- Reference: Swich PayOut Implementation Plan §6
-- ============================================================

-- 1. Payout status enums
DO $$ BEGIN
  CREATE TYPE payout_internal_status AS ENUM (
    'ready_to_submit',   -- Payout created and title validated, awaiting IBFT dispatch
    'processing',        -- Submitted to Swich (status: Initiated or Queue)
    'successful',        -- Confirmed success (0000 / Success)
    'failed',            -- Provider explicitly returned terminal failure
    'needs_review',      -- Timeout, network failure, or unknown provider state requiring inquiry
    'expired',           -- Expired in Swich queue
    'terminated',        -- Terminated by provider
    'cancelled'          -- Cancelled by admin prior to IBFT dispatch
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_transaction_id     VARCHAR(64) NOT NULL UNIQUE,
  swich_transaction_id        VARCHAR(64),
  idempotency_key             VARCHAR(128) NOT NULL UNIQUE,
  recipient_type              VARCHAR(50) NOT NULL DEFAULT 'custom', -- seller | affiliate | customer_refund | custom
  recipient_reference_id      VARCHAR(128),                          -- link to order, user, or vendor
  recipient_name              VARCHAR(255) NOT NULL,
  recipient_cnic_masked       VARCHAR(20) NOT NULL,
  recipient_cnic_encrypted    TEXT NOT NULL,
  recipient_msisdn_masked     VARCHAR(20) NOT NULL,
  recipient_msisdn_encrypted  TEXT NOT NULL,
  bank_code                   VARCHAR(50) NOT NULL,
  bank_name                   VARCHAR(100) NOT NULL,
  account_number_last4        VARCHAR(8) NOT NULL,
  account_number_encrypted    TEXT NOT NULL,
  account_title               VARCHAR(255) NOT NULL,
  title_verification_ref      VARCHAR(128),
  amount                      NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency                    VARCHAR(3) NOT NULL DEFAULT 'PKR' CHECK (currency = 'PKR'),
  country_code                VARCHAR(5) NOT NULL DEFAULT '92',
  internal_status             payout_internal_status NOT NULL DEFAULT 'ready_to_submit',
  provider_status             VARCHAR(50),
  provider_code               VARCHAR(20),
  provider_message            TEXT,
  provider_response_json      JSONB,
  requested_by                VARCHAR(128) NOT NULL,
  approved_by                 VARCHAR(128),
  reason                      TEXT,
  admin_note                  TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_customer_tx_id ON public.payouts (customer_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payouts_swich_tx_id ON public.payouts (swich_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payouts_internal_status ON public.payouts (internal_status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON public.payouts (created_at DESC);

-- 3. Append-only status event log
CREATE TABLE IF NOT EXISTS public.payout_status_events (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payout_id          UUID NOT NULL REFERENCES public.payouts(id) ON DELETE CASCADE,
  previous_status    VARCHAR(50),
  new_status         VARCHAR(50) NOT NULL,
  provider_status    VARCHAR(50),
  provider_code      VARCHAR(20),
  message            TEXT,
  source             VARCHAR(50) NOT NULL, -- admin_submit | ibft_response | inquiry | reconciliation | admin_cancel
  actor_user_id      VARCHAR(128),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_events_payout_id ON public.payout_status_events (payout_id, created_at ASC);

-- 4. Provider call attempt audit (tracks every raw HTTP exchange)
CREATE TABLE IF NOT EXISTS public.payout_provider_attempts (
  id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payout_id                   UUID REFERENCES public.payouts(id) ON DELETE SET NULL,
  operation                   VARCHAR(50) NOT NULL, -- fetch_title | ibft | inquire | balance
  attempt_number              INTEGER NOT NULL DEFAULT 1,
  request_metadata_redacted   JSONB,
  response_metadata_redacted  JSONB,
  http_status                 INTEGER,
  provider_code               VARCHAR(20),
  started_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at                 TIMESTAMPTZ,
  outcome                     VARCHAR(30) NOT NULL, -- success | failure | unknown
  error_category              VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_payout_attempts_payout_id ON public.payout_provider_attempts (payout_id);
CREATE INDEX IF NOT EXISTS idx_payout_attempts_started_at ON public.payout_provider_attempts (started_at DESC);

-- 5. Merchant balance snapshots
CREATE TABLE IF NOT EXISTS public.payout_balance_snapshots (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  balance            NUMERIC(18,2) NOT NULL,
  currency           VARCHAR(5) NOT NULL DEFAULT 'PKR',
  day_end_balance    NUMERIC(18,2),
  total_commission   NUMERIC(18,2),
  daily_commission   NUMERIC(18,2),
  provider_status    VARCHAR(50),
  fetched_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_balance_fetched ON public.payout_balance_snapshots (fetched_at DESC);
