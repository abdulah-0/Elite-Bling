# Swich PayIn Integration — Implementation PRD

| | |
|---|---|
| **Document** | `implementation.prd.md` |
| **Product** | E-commerce store — online payments via Swich PayIn |
| **Source of truth** | *Swich PayIn API Integration Guide* (`API_Plugin.docx`) |
| **Status** | Ready for implementation (open questions in §16 must be sent to Swich before Phase 1 go-live) |
| **Audience** | The developer and the AI code editor (Cursor / Windsurf) executing this plan |

---

## 0. How to use this document (instructions for the AI code editor)

1. Implement **phase by phase** (§14). Do not start a phase until the previous phase's acceptance criteria pass.
2. **Do not invent Swich API behaviour.** Everything Swich-specific is in §4. Anything marked **`[VERIFY]`** is ambiguous in Swich's documentation: implement it behind a config flag or a single isolated function, add a `// TODO(VERIFY): ...` comment, and list it in the PR description.
3. All Swich calls, secrets and checksum logic live **server-side only**. Nothing under `NEXT_PUBLIC_*` may contain a Swich secret.
4. Treat every Swich response code as a **string** (`"0000"`, `"00012"`, `"9900"`). The docs show some as bare numbers; they are not.
5. Follow the existing conventions of the codebase (folder layout, lint rules, component library, design system). Where this PRD names a path, adapt it to the project's real structure.
6. Every task has acceptance criteria. Write tests for them.

---

## 1. Overview

### 1.1 Problem
The store needs to accept online payments from customers in Pakistan using local methods (cards, e-wallets such as Easypaisa/JazzCash, bank accounts, Raast QR / RTP, 1Bill). Swich PayIn provides these through (a) a **hosted landing page / PWA** and (b) **direct server-to-server APIs**.

### 1.2 Goals
- **G1.** A customer can pay for an order online and the order is reliably marked *paid* — exactly once — even if they close the browser mid-payment.
- **G2.** No card or credential data ever touches the store's servers or database.
- **G3.** Payment state is always recoverable: every attempt is reconcilable against Swich via the Inquire API.
- **G4.** Admins can see payment status, re-check a payment, and issue full/partial refunds.
- **G5.** The integration is isolated behind a provider interface so the code is replaceable and testable (sandbox ↔ production switch by config only).

### 1.3 Non-goals (this PRD)
Payouts/disbursements, multi-currency pricing, saved cards on the store's side, chargeback/dispute workflow beyond surfacing status, Swich merchant-portal tooling. (Recurring card payments are an optional late phase — §14, Phase 4.)

### 1.4 Success metrics
| Metric | Target |
|---|---|
| Orders stuck in `pending` > 30 min | < 0.5 % (all resolved by reconciliation) |
| Paid orders with no matching successful Swich transaction (and vice versa) | 0 |
| Duplicate "paid" side-effects (emails, stock decrement) per order | 0 |
| Callback handler p95 latency | < 1 s |
| Checkout → redirect to Swich p95 (excl. Swich) | < 800 ms |

---

## 2. Assumptions

> Adjust if wrong; they only affect file paths and SQL naming, not the design.

- **A1.** Stack: **Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, RLS)**. Server logic in Route Handlers / Server Actions using the Supabase **service-role** client.
- **A2.** An `orders` table already exists with at least: `id uuid`, `user_id uuid` (nullable for guests), `total numeric(12,2)`, `currency text`, a human order number, and a status column. This PRD adds payment columns/tables; it does not redesign orders.
- **A3.** Currency is **PKR** only.
- **A4.** Hosting is serverless (e.g. Vercel). **Serverless egress IPs are not static** — this matters for Swich's mandatory IP whitelisting (see D3).
- **A5.** Existing non-Swich methods (e.g. cash on delivery) keep working and are not touched.
- **A6.** The store has an admin dashboard with role-based access (RLS-enforced roles).

---

## 3. Key design decisions

| # | Decision | Rationale |
|---|---|---|
| **D1** | **Phase 1 uses the Swich hosted Landing Page / PWA**, not the direct APIs. | Fastest path to a working, PCI-light checkout. The customer picks the method on Swich's page; cards are entered there. No IP whitelisting needed for the browser redirect. |
| **D2** | Default landing mode is **GET** (`LANDING_MODE=get`), with **POST (AES-encrypted)** implemented behind the same interface (`LANDING_MODE=post`). | GET is fully specified in the docs. GET puts name/email/phone in the URL (browser history, proxy logs); POST avoids that but the AES parameters (mode/IV/padding) are not documented `[VERIFY]`. Switch to POST for production once Swich confirms. |
| **D3** | Direct APIs (e-wallet, QR, RTP, bank, 1Bill, refund, recurring) are **called only from a fixed-IP service**, never straight from serverless functions. | Swich states "IP whitelisting is mandatory" for these endpoints. Options: Vercel Static IPs add-on, or a tiny proxy service (e.g. FastAPI/Node) on a VPS with a static IP that the Next.js app calls with a shared secret. **Refunds need this too**, so it is required by Phase 2 if refunds are in scope. |
| **D4** | **The callback is the primary source of truth; Inquire is the verifier and safety net.** The browser redirect is *never* trusted. | The redirect only fires on **successful** payments and carries no signature; users can also close the tab. Callback is HMAC-signed; a scheduled reconciliation job covers missed callbacks. |
| **D5** | **Every payment attempt gets a fresh `customerTransactionId`.** An order can have many attempts. | Swich rejects duplicates (`0001`), so a retry after failure cannot reuse an ID. |
| **D6** | **Order amount is always computed server-side from the database**, never accepted from the client. | Prevents price tampering. |
| **D7** | **State changes happen in one Postgres function** (`apply_payment_status`) using row locks. | Gives idempotency and exactly-once side effects under concurrent callbacks/redirects/cron. |
| **D8** | **Never auto-retry a POST that moves money.** On timeout/5xx for a purchase POST, call Inquire first. | Avoids double charges. |

---

## 4. Swich PayIn reference (condensed from the integration guide)

### 4.1 Environments

| Purpose | Sandbox | Production |
|---|---|---|
| API base (`{base_url}`) | `https://sandbox-api.swichnow.com` | `https://api.swichnow.com` |
| Auth token (POST) | `https://sandbox-auth.swichnow.com/connect/token` | `https://auth.swichnow.com/connect/token` |
| Landing page (GET) | `https://sandbox-payin-pwa.swichnow.com/` | `https://payin-pwa.swichnow.com/` |
| Landing page (POST) | `https://sandbox-payinpwa20.swichnow.com/Transaction/Index` | `https://payin2pwa.swichnow.com/Transaction/Index` |

### 4.2 Authentication (all `{base_url}` APIs)
- `POST` to the auth URL, `Content-Type: application/x-www-form-urlencoded`, body: `grant_type=client_credentials`, `client_id`, `client_secret`.
- Success: `{ "access_token": "…", "token_type": "Bearer", "expires_in": 3600 }` (seconds).
- Use `Authorization: Bearer <access_token>` on every API call. Missing/expired token → `401`.
- Bad credentials → `401` with `{ "error": "invalid_client", … }`.

### 4.3 Landing Page (GET) — query parameters
Use **exactly** these casings (they match Swich's sample URLs).

| Param | Req | Notes |
|---|---|---|
| `clientId` | Yes | Provided by Swich |
| `customerTransactionId` | Yes | Unique per attempt, **max 50 chars** |
| `item` | Yes | Max 500 chars, **no special characters** |
| `amount` | Yes | Greater than 10.00 and up to 50,000.00 PKR `[VERIFY inclusive bounds]` |
| `channel` | Yes | Always `0` |
| `checksum` | Yes | See §4.5 |
| `description` | Yes | Purpose of transaction |
| `billReferenceNo` | Cond. | Mandatory for bank payments → send the order number always |
| `PayeeName` | Yes | Payer's name |
| `Email` | Yes | Payer's email |
| `MSISDN` | Yes | Preferred `03xxxxxxxxx` |
| `currency` | No | `PKR` or `USD` (we send `PKR`) |
| `transactionType` | Cond. | Required for QR and RTP; values supplied by Swich |
| `successRedirectUrl` | No | Overrides the redirect URL configured at Swich. **Redirect fires only on success** |
| `isRecurringPayment`, `recurringPaymentType` (`None`/`Manual`/`Auto`), `recurringStartDateTime`, `recurringEndDateTime`, `recurringFrequency` (days), `recurringSchedulerTime` (`HH:mm`) | Cond. | Recurring card only (Phase 4) |

### 4.4 Landing Page (POST)
Form-post to the POST URL with two fields: `ClientId` and `Token`, where `Token` = **AES-encrypted JSON** of the same parameters (PascalCase: `ClientId, CustomerTransactionId, Item, Amount, Channel, Checksum, Description, BillReferenceNo, PayeeName, Email, MSISDN, Currency, TransactionType, IsRecurringPayment, SuccessRedirectUrl`). `Amount` may be `null` to let the customer type it (not used by the store). Keys are shared by Swich on integration. **`[VERIFY]` AES mode, key/IV encoding, padding, output encoding.**

### 4.5 Checksums (HMAC-SHA256, hex)
```
Landing page:  HMAC_SHA256(SecretKey, "Swich:{customerTransactionId}:{item}:{amount}")
Callback:      HMAC_SHA256(SecretKey, "SWCallback:{CustomerTransactionId}:{OrderId}:{Amount}:{Status}")
```
- Output is lowercase hex (the sample is 64 hex chars). Compare with `timingSafeEqual`.
- `amount` in the landing checksum must be the **identical string** sent in the URL.
- **`[VERIFY]`** Is `SecretKey` the same value as `client_secret`? Treat as a separate env var.
- **`[VERIFY]`** Amount string format in the callback checksum (`10`, `10.00`, `10.0000`)? Implementation rule: use the **raw string exactly as received** in the callback query string; if that fails, also try `Number(x).toString()`, `toFixed(2)`, `toFixed(4)` before rejecting (see §8.4).

### 4.6 Callback (Swich → store)
- **HTTP GET** to a URI the merchant chooses (registered with Swich `[VERIFY how/where]`).
- Query params: `PaymentType`, `Status`, `OrderId`, `CustomerTransactionId`, `Amount`, `Checksum`.
- `Status` ∈ `pending`, `success`, `failed`, `block/expired`, `terminated`.
- Must answer **2xx** with body `{ "status": "success" }`. Otherwise Swich retries every **5 minutes, up to 5 attempts** (permanent errors may be discarded).

### 4.7 Transaction status values (Inquire)
`pending, queue, success, failed, block, terminated, dispute, otp send, refund, partial refund`

### 4.8 Endpoint catalogue (`{base_url}` = §4.1; bearer token required; **IP whitelist mandatory** unless noted)

| Capability | Method + path | Key request fields | Key response fields |
|---|---|---|---|
| **Inquire** (no whitelist stated `[VERIFY]`) | `GET /gateway/payin/v2.0/inquire?CustomerTransactionId=` | — | `transaction{id, orderId, categoryName, channelName, amount, transactionStatus, channelTransactionId, createdDateTime, consumerNumber}`, `status`, `code` |
| **Refund** | `POST /gateway/payin/v2.0/purchase/refund` | `OrderId` (Swich), `Reason` (≤500), `Amount` (≤ original; less = partial) | `status`, `code`, `message` |
| E-wallet | `POST /gateway/payin/v2.0/purchase/ewallet` | `customerTransactionId, categoryId, channelId` (Easypaisa **8**, JazzCash **10**), `item, amount, msisdn`, optional `cnic, email, ucid, remoteIPAddress` | `code, status, transactionId, orderId, message` |
| 1Bill (biller) | `POST /gateway/payin/v2.0/purchase/biller` | same as e-wallet with `categoryId` **3**, `channelId` **11** | adds `consumerNumber` (voucher the customer pays at 1Bill) |
| Bank list | `GET /gateway/payin/get/banks` ⚠ no `v2.0` in path | — | `data[{name, code}]` |
| Bank OTP | `POST /gateway/payin/v2.0/bank/otp` | `customerTransactionId, bankCode, description, item, amount, msisdn, cnic, email, billReferenceNo, consumerName, accountNo` | `transactionId, orderId, transactionReferenceNo, retreivalReferenceNo` |
| Bank transfer | `POST /gateway/payin/v2.0/bank/transfer` | `customerTransactionId, transactionId, orderId, billReferenceNo, transactionReferenceNo, retreivalReferenceNo, otp` | `status, code` |
| QR generate (Raast dynamic) | `POST /gateway/payin/v2.0/purchase/qr/dynamic` | `customerTransactionId, name, transactionType, amount, msisdn`, optional `billReferenceNo, email, cnic, currency` | `qrString, stan, retrievalNo, expireAt` |
| QR cancel / inquire | `POST …/purchase/qr/dynamic/cancel` and `…/inquire` | `customerTransactionId` | `status/code`; inquire adds `paymentStatus` |
| RTP title | `GET /gateway/payin/v2.0/purchase/rtp/title` | `customerTransactionId, bankCode, accountNumber` or `accountNumberAlias` (Raast ID), `transactionType`, optional `billReferenceNo` | `title, rtpId, expiry` |
| RTP bank lists | `GET …/rtp/now/get/banks`, `GET …/rtp/later/get/banks` | — | `data[{name, code}]` |
| RTP now / later | `POST …/purchase/rtp/now`, `…/purchase/rtp/later` | `CustomerTransactionId, bankCode, accountTitle, accountNumber`/`accountNumberAlias, transactionType, name, amount, msisdn, rtpId`, optional `billReferenceNo, email, cnic, currency` | `transactionId, orderId, stan, retrievalNo, expireAt` |
| RTP cancel / inquire | `POST …/purchase/rtp/cancel`, `…/purchase/rtp/inquire` | `CustomerTransactionId` | inquire: `paymentStatus` (e.g. `RTP Accepted`) |
| Recurring: get instrument | `GET …/purchase/card/recurring/instrument?msisdn=` | — | `instrumentToken` |
| Recurring: charge | `POST …/purchase/card/recurring` | `customerTransactionId, item, name, amount, msisdn, instrumentToken`, optional rest | `transactionId, orderId` |

**Documented quirks to handle defensively**
- Bank-list and RTP bank-list failures can return `"status":"success"` with `data: null` → always check `data` is a non-empty array.
- E-wallet success example shows `"code": 0000` (invalid JSON number) → parse leniently, compare as string.
- Response-code meanings overlap (e.g. `0009` = SYSTEM_ERROR *and* "invalid for refund"; `0014` = refund > amount *and* INVALID_BUNDLE_AMOUNT) → key behaviour on **endpoint + code + message**, not code alone.
- Doc typo: biller amount "in PKE" means PKR.

---

## 5. Architecture and flows

### 5.1 Components
```
Browser ──► Next.js (Route Handlers) ──► Supabase (service role)
   │              │   ▲                         ▲
   │              │   └── callback (GET) ───────┤ Swich PayIn
   ▼              ▼                              │
Swich Landing   Swich Auth + API  ◄──────────────┘
Page / PWA      (Inquire from Next.js; whitelisted endpoints via fixed-IP service, Phase 2+)
```

### 5.2 Happy path — hosted landing page (Phase 1)
```
1. Customer clicks "Pay online" on checkout (order already created, status=pending_payment)
2. POST /api/payments/swich/initiate {orderId}
     - auth + ownership check, load order, recompute payable amount, validate limits
     - insert payment_attempts (status=initiated, customer_transaction_id=new)
     - build landing URL/form + checksum (server-side)
     - return {redirectUrl} (GET mode) or {action, fields} (POST mode)
3. Browser navigates to Swich landing page; customer chooses method and pays
4. Swich → GET /api/payments/swich/callback?Status=success&OrderId=SW..&CustomerTransactionId=..&Amount=..&Checksum=..
     - verify checksum → Inquire to confirm → apply_payment_status() → 200 {"status":"success"}
5. Swich redirects browser to successRedirectUrl (only on success) → /checkout/payment-return?ref=<publicRef>
6. Return page polls GET /api/orders/{ref}/payment-status until paid / failed / timeout
7. Side effects (confirmation email/WhatsApp, stock commit) fire once, from the DB transition — not from the redirect
```

### 5.3 Failure / edge paths
| Situation | Expected behaviour |
|---|---|
| Customer closes tab before paying | Attempt stays `redirected`; cron Inquire → `expired`/`failed` after the window; stock released; customer can retry (new attempt). |
| Customer pays, closes tab before redirect | Callback marks order paid. Confirmation sent. Return page not needed. |
| Redirect arrives before callback | Return page shows "Confirming your payment…" and polls; never marks paid itself. |
| Callback arrives twice / out of order | `apply_payment_status` is idempotent; `paid` is never downgraded to `failed`/`pending`. |
| Callback lost | Cron Inquire catches it (≤ 10 min). |
| Success callback after attempt/order was expired or cancelled | Money was taken → mark `paid`, set order `needs_review`, alert admin (refund or fulfil). |
| Callback amount ≠ attempt amount | Do **not** mark paid; status `needs_review`; alert. |
| Swich auth/API down | Initiate returns a friendly error; checkout offers other methods; nothing is charged. |

---
## 6. Functional requirements

Priority: **P0** = Phase 1 (must ship), **P1** = Phase 2, **P2** = Phase 3+.

| ID | Requirement | Pri |
|---|---|---|
| FR-1 | Checkout offers "Pay online (Swich)" when `SWICH_ENABLED=true` and the order total is within `[SWICH_MIN_AMOUNT, SWICH_MAX_AMOUNT]`. Outside the range the option is hidden/disabled with an explanation and other methods remain available. | P0 |
| FR-2 | `POST /api/payments/swich/initiate` creates a payment attempt and returns the redirect target. Amount comes from the DB. Caller must own the order (or hold the guest-order token). | P0 |
| FR-3 | Each attempt has a unique `customer_transaction_id` (≤ 50 chars, `[A-Za-z0-9]` only; recommended: UUID v4 without dashes = 32 chars). | P0 |
| FR-4 | `GET /api/payments/swich/callback` verifies the checksum, records the event, confirms via Inquire, and transitions state through `apply_payment_status`. Always answers `{ "status": "success" }` with HTTP 200 for any callback that was **authentic** (even if already processed); answers 4xx for invalid checksum or unknown transaction. | P0 |
| FR-5 | Return page (`successRedirectUrl` target) shows live status by polling our own API; never trusts query params. | P0 |
| FR-6 | Order becomes `paid` exactly once; confirmation notifications and stock commitment run once, triggered by that transition. | P0 |
| FR-7 | Failed/expired attempts leave the order payable: customer can retry (new attempt) or switch method. Stock reservations (if the store uses them) are released on `failed`/`expired` only after the final-state check. | P0 |
| FR-8 | Reconciliation cron Inquires every non-terminal attempt older than 10 minutes and applies the result. | P1 |
| FR-9 | Admin "Payments" view: list/filter attempts, see timeline of events, "Re-check with Swich" button (Inquire). | P1 |
| FR-10 | Admin refund (full or partial) for paid attempts through the refund API; refund history per order. | P1 |
| FR-11 | Direct-API methods (e-wallet, 1Bill, Raast QR, RTP, bank transfer) as in-store checkout options via the fixed-IP service. | P2 |
| FR-12 | Recurring card payments (subscriptions). | P2 |
| FR-13 | Feature flag + sandbox/production switch purely by environment variables. | P0 |

---

## 7. Data model (Supabase / Postgres)

Adapt `orders` references to the real table. Run as a migration.

```sql
-- 7.1 Enums
create type payment_attempt_status as enum (
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

create type refund_status as enum ('requested', 'succeeded', 'failed');

-- 7.2 Payment attempts (one per customerTransactionId)
create table public.payment_attempts (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references public.orders(id) on delete restrict,
  provider                 text not null default 'swich',
  method                   text not null default 'landing_page',  -- landing_page | ewallet | qr | rtp | bank | biller | card_recurring
  customer_transaction_id  text not null unique
                           check (char_length(customer_transaction_id) <= 50),
  swich_order_id           text,                       -- e.g. "SW24106", learned from callback/inquire
  status                   payment_attempt_status not null default 'initiated',
  amount                   numeric(12,2) not null check (amount > 0),
  currency                 text not null default 'PKR',
  provider_status          text,                       -- raw Swich status string
  provider_code            text,                       -- raw response code (string!)
  provider_message         text,
  payment_type             text,                       -- from callback PaymentType
  failure_reason           text,
  initiated_at             timestamptz not null default now(),
  redirected_at            timestamptz,
  completed_at             timestamptz,                -- when paid/failed/expired first set
  last_checked_at          timestamptz,                -- last Inquire
  expires_at               timestamptz not null,       -- initiated_at + SWICH_ATTEMPT_TTL_MINUTES
  refunded_amount          numeric(12,2) not null default 0 check (refunded_amount >= 0),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on public.payment_attempts (order_id);
create index on public.payment_attempts (status, initiated_at)
  where status in ('initiated','redirected','pending');

-- 7.3 Append-only event log (callbacks, inquiries, refunds, admin actions)
create table public.payment_events (
  id                 bigint generated always as identity primary key,
  attempt_id         uuid references public.payment_attempts(id) on delete cascade,
  customer_transaction_id text,
  source             text not null,        -- callback | inquire | refund | redirect | system | admin
  provider_status    text,
  checksum_valid     boolean,
  payload            jsonb not null,       -- sanitised: no secrets, no tokens
  dedupe_key         text unique,          -- sha256(source + raw query/body) for idempotent callbacks
  received_at        timestamptz not null default now()
);
create index on public.payment_events (attempt_id, received_at);

-- 7.4 Refunds
create table public.payment_refunds (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.payment_attempts(id),
  swich_order_id     text not null,
  amount             numeric(12,2) not null check (amount > 0),
  reason             text not null check (char_length(reason) <= 500),
  status             refund_status not null default 'requested',
  provider_code      text,
  provider_message   text,
  requested_by       uuid not null,        -- admin user id
  created_at         timestamptz not null default now(),
  completed_at       timestamptz
);

-- 7.5 Orders: add payment columns (if not present)
alter table public.orders
  add column if not exists payment_status text not null default 'unpaid',  -- unpaid | paid | needs_review | partially_refunded | refunded
  add column if not exists paid_at timestamptz,
  add column if not exists public_payment_ref text unique default encode(gen_random_bytes(12), 'hex');

-- 7.6 RLS: clients never write payment tables; owners may read their own attempts' status
alter table public.payment_attempts enable row level security;
alter table public.payment_events   enable row level security;
alter table public.payment_refunds  enable row level security;

create policy "owner can read own attempts" on public.payment_attempts
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
-- payment_events / payment_refunds: no client policies (service role + admin role only)
-- Add an admin SELECT policy using the project's existing role mechanism.
```

### 7.7 Transition function (idempotent, race-safe)
Implement as a PL/pgSQL function called only by the service role.

```sql
create or replace function public.apply_payment_status(
  p_customer_transaction_id text,
  p_new_status payment_attempt_status,
  p_provider_status text,
  p_provider_code text,
  p_provider_message text,
  p_swich_order_id text,
  p_amount numeric,
  p_payment_type text default null
) returns table (transitioned boolean, attempt_id uuid, order_id uuid, final_status payment_attempt_status)
language plpgsql security definer set search_path = public as $$
declare a public.payment_attempts%rowtype;
begin
  select * into a from public.payment_attempts
   where customer_transaction_id = p_customer_transaction_id for update;
  if not found then return; end if;

  -- 1. amount guard for success
  if p_new_status = 'paid' and p_amount is not null and p_amount <> a.amount then
    update public.payment_attempts set status='needs_review',
      failure_reason='amount_mismatch', updated_at=now() where id=a.id;
    update public.orders set payment_status='needs_review' where id=a.order_id;
    return query select false, a.id, a.order_id, 'needs_review'::payment_attempt_status; return;
  end if;

  -- 2. monotonic rules: never leave paid/refunded states for failed/pending/expired
  if a.status in ('paid','partially_refunded','refunded','disputed')
     and p_new_status in ('initiated','redirected','pending','failed','expired') then
    return query select false, a.id, a.order_id, a.status; return;
  end if;
  if a.status = p_new_status then
    return query select false, a.id, a.order_id, a.status; return;
  end if;

  -- 3. late success after expiry/failure => paid but flag for review
  update public.payment_attempts set
      status = p_new_status,
      provider_status = p_provider_status, provider_code = p_provider_code,
      provider_message = p_provider_message,
      swich_order_id = coalesce(p_swich_order_id, swich_order_id),
      payment_type = coalesce(p_payment_type, payment_type),
      completed_at = case when p_new_status in ('paid','failed','expired') and completed_at is null then now() else completed_at end,
      updated_at = now()
   where id = a.id;

  if p_new_status = 'paid' then
    update public.orders set
        payment_status = case when a.status in ('expired','failed') then 'needs_review' else 'paid' end,
        paid_at = coalesce(paid_at, now())
     where id = a.order_id and payment_status <> 'paid';
    return query select true, a.id, a.order_id, p_new_status; return;
  end if;

  return query select true, a.id, a.order_id, p_new_status;
end $$;
revoke all on function public.apply_payment_status from public, anon, authenticated;
```
The application calls `transitioned = true && final_status = 'paid'` to trigger **once-only** side effects via an outbox (insert a row into the existing notification/outbox mechanism, or create `notification_outbox`). Refund-related transitions use a sibling function `apply_refund_result(...)` with the same locking pattern.

### 7.8 Status mapping (Swich → internal)

| Swich value (callback `Status` / Inquire `transactionStatus`) | Internal `payment_attempt_status` |
|---|---|
| `pending`, `queue`, `otp send` | `pending` |
| `success` | `paid` |
| `failed` | `failed` |
| `block`, `terminated` | `failed` (store raw value in `provider_status`) |
| `block/expired` (callback) | `expired` |
| `dispute` | `disputed` |
| `refund` | `refunded` |
| `partial refund` | `partially_refunded` |
| unknown value | keep current status, log `needs_review`-grade alert |

Matching is case-insensitive and trims whitespace.

---

## 8. Backend design

### 8.1 Module layout
```
src/lib/payments/swich/
  config.ts        # zod-validated env, URL derivation by SWICH_ENV, limits
  types.ts         # zod schemas for every request/response used
  auth.ts          # getAccessToken(): in-memory cache, refresh 60 s before expiry, single-flight; on 401 refetch once
  http.ts          # fetch wrapper: timeout 15 s, bearer, redaction, GET-only retries (2, backoff), request-id logging
  checksum.ts      # landingChecksum(), callbackChecksum(), verifyCallbackChecksum()
  landing.ts       # buildLandingGetUrl(), buildLandingPostForm() (AES), sanitiseItem(), normaliseMsisdn()
  inquire.ts       # inquireByCustomerTransactionId()
  status-map.ts    # §7.8
  codes.ts         # response-code → {kind, retryable, userMessage, alert}
  service.ts       # initiatePayment(), handleCallback(), reconcileAttempt(), refundPayment()
  methods/         # Phase 3: ewallet.ts, biller.ts, qr.ts, rtp.ts, bank.ts, recurring.ts
src/app/api/payments/swich/initiate/route.ts
src/app/api/payments/swich/callback/route.ts
src/app/api/payments/swich/refund/route.ts            # admin only
src/app/api/cron/swich-reconcile/route.ts             # CRON_SECRET protected
src/app/api/orders/[ref]/payment-status/route.ts
src/app/(shop)/checkout/payment-return/page.tsx
supabase/migrations/XXXX_swich_payments.sql
```
Route handlers that use `crypto` set `export const runtime = 'nodejs'; export const dynamic = 'force-dynamic';`.

### 8.2 `POST /api/payments/swich/initiate`
**Request:** `{ "orderId": "uuid" }`
**Steps (all server-side):**
1. Authenticate; verify the order belongs to the caller (or valid guest token). Reject if `orders.payment_status = 'paid'`.
2. Recompute payable amount from the DB (items + shipping + tax − discounts). Reject outside `[SWICH_MIN_AMOUNT, SWICH_MAX_AMOUNT]` with `422 amount_out_of_range`.
3. Validate payer data: name, email, `normaliseMsisdn()` → `^03\d{9}$`. Missing phone → `422 phone_required` (UI collects it).
4. **Reuse rule:** if an attempt for this order is `initiated`/`redirected` and `now < expires_at − 5 min`, return a rebuilt URL for the **same** `customer_transaction_id` (prevents double-click duplicates). Otherwise create a new attempt (new ID) and mark older non-terminal ones `expired` only after an Inquire shows they are not paid.
5. Build item = `sanitiseItem("Order " + orderNumber)` (strip everything except `A-Za-z0-9` and space, trim, ≤ 500 chars).
6. Amount string = `amount.toFixed(2)` — **the same string** goes into the URL and the checksum.
7. Checksum per §4.5. Build `redirectUrl` (GET) or `{ action, fields: { ClientId, Token } }` (POST).
8. `successRedirectUrl = ${SITE_URL}/checkout/payment-return?ref=${public_payment_ref}` (URL-encoded).
9. Set `status='redirected'`, `redirected_at=now()`. Return `{ redirectUrl }` or `{ action, fields }`.

**Errors:** `401`, `403`, `404 order_not_found`, `409 already_paid`, `422 …`, `503 payment_provider_unavailable` (feature flag off). Never expose Swich internals to the client.

### 8.3 Landing page URL builder (GET)
- Base: `SWICH_PWA_URL` (derived from env). Build with `URLSearchParams` so encoding is correct, but compute the checksum from the **raw** (un-encoded) values.
- Parameter set: `clientId, customerTransactionId, item, amount, channel=0, billReferenceNo=<orderNumber>, description="Payment for order <orderNumber>", PayeeName, Email, MSISDN, currency=PKR, checksum, successRedirectUrl`.
- Optional `transactionType` from `SWICH_TRANSACTION_TYPE` (needed only if Swich requires it for QR/RTP on the page `[VERIFY]`).

### 8.4 `GET /api/payments/swich/callback`
1. Parse `PaymentType, Status, OrderId, CustomerTransactionId, Amount, Checksum` from the query string. Missing any → `400`.
2. Compute `HMAC_SHA256(SWICH_SECRET_KEY, "SWCallback:{CustomerTransactionId}:{OrderId}:{Amount}:{Status}")` using the **raw received strings**; compare to `Checksum` (case-insensitive hex, `timingSafeEqual`). On mismatch, retry with normalised amount variants (`Number(Amount).toString()`, `.toFixed(2)`, `.toFixed(4)`); if all fail → store event with `checksum_valid=false`, return `401`.
3. Insert into `payment_events` with `dedupe_key = sha256("callback" + rawQuery)`; on conflict → already handled → return `200 {"status":"success"}`.
4. Load attempt by `CustomerTransactionId`; unknown → `404` (and log).
5. **If `Status` maps to `paid`:** call Inquire; require `transactionStatus === 'success'` and amount equal. If Inquire is unreachable, still apply the callback result **only** if checksum was valid, and schedule a reconcile Inquire (checksum is the authenticity proof; Inquire is defence-in-depth).
6. Call `apply_payment_status(...)`.
7. If `transitioned && final_status === 'paid'` → enqueue side effects (outbox / `after()` from `next/server`).
8. Return `200` with exactly `{ "status": "success" }`. Respond quickly; no email/network work in the request path.

The route must be excluded from auth middleware, CSRF protection and any bot/WAF challenge. Optionally restrict by Swich's source IPs if provided `[VERIFY]`.

### 8.5 Reconciliation (`/api/cron/swich-reconcile`)
- Triggered every **5 min** (Vercel Cron or Supabase `pg_cron` + Edge Function), header `Authorization: Bearer ${CRON_SECRET}`.
- Select attempts in `initiated|redirected|pending` with `initiated_at < now() - 10 min`, limit 50, oldest first.
- For each: Inquire → map status → `apply_payment_status`. Not-found/pending past `expires_at` (`SWICH_ATTEMPT_TTL_MINUTES`, default **60** `[VERIFY with Swich: session lifetime]`) → `expired`.
- Daily job: list `paid` attempts of the last 48 h whose `last_checked_at` is older than 24 h and re-Inquire (detects later refunds/disputes).
- Idempotent and safe to run concurrently (row locks in the DB function).

### 8.6 Refunds (Phase 2) — `POST /api/payments/swich/refund`
- Admin role required. Body: `{ attemptId, amount, reason }`.
- Preconditions: attempt `paid` or `partially_refunded`; `swich_order_id` present; `amount > 0`; `amount <= amount − refunded_amount`; reason 1–500 chars.
- Insert `payment_refunds(status='requested')` under a row lock on the attempt (blocks double-clicks).
- Call `POST …/purchase/refund` **through the fixed-IP service (D3)** with `{ OrderId, Reason, Amount }`.
- Success (`0000`/`00001`): refund `succeeded`; `refunded_amount += amount`; attempt → `partially_refunded` or `refunded`; order `payment_status` updated.
- `0009` "invalid for refund" (method not refundable) → refund `failed`, show "This payment method can't be refunded online — refund manually."
- `0014` over-amount → `failed`, show message.
- Timeout/unknown → leave `requested`, run Inquire; if `refund`/`partial refund` is reported mark succeeded, otherwise flag for admin.
- Never auto-retry the POST.

### 8.7 Direct methods (Phase 3) — implementation rules
- Only callable from the fixed-IP service. The Next.js app calls it with `FIXED_IP_GATEWAY_URL` + `FIXED_IP_GATEWAY_SECRET` (HMAC-signed request body + timestamp, 60 s skew).
- **E-wallet:** `categoryId` for e-wallets is **not documented** `[VERIFY]`; `channelId` 8 = Easypaisa, 10 = JazzCash. Response is synchronous (`0000` = success, `9900` = OTP/vendor failure) but still confirm via callback/Inquire.
- **1Bill:** `categoryId=3`, `channelId=11`; show the returned `consumerNumber` to the customer; payment completes later via callback.
- **Raast QR:** generate → render `qrString` as a QR image client-side; poll our status endpoint; cancel on user abandon; honour `expireAt`.
- **RTP:** flow = bank list → **title** (get `rtpId`, `title`) → show title for user confirmation → RTP now/later → poll → cancel if abandoned.
- **Bank transfer:** bank list → OTP → transfer with the OTP; keep `transactionId, orderId, transactionReferenceNo, retreivalReferenceNo` in the attempt row (add a `provider_refs jsonb` column).
- Each method uses the **same** attempt table, callbacks and state machine.

---

## 9. UX requirements

### 9.1 Checkout
- Payment method selector with "Pay online — cards, wallets, bank (Swich)". Button label: **Pay PKR {amount}**. Disabled + spinner while initiating; double-click safe (§8.2 step 4).
- Pre-fill name/email/phone; validate the `03xxxxxxxxx` mobile format before calling initiate.
- Totals above the limit: inline notice "Online payment supports orders up to PKR 50,000. Please choose another payment method."

### 9.2 Return page `/checkout/payment-return?ref=…`
| State (from `GET /api/orders/{ref}/payment-status`) | UI |
|---|---|
| `paid` | Success screen, order summary, "View order". |
| `initiated` / `redirected` / `pending` | "Confirming your payment…" with spinner; poll every 3 s for up to 2 min, then show "Still processing — we'll email you once it's confirmed. You can safely close this page." |
| `failed` / `expired` | Failure screen with provider message (when safe), **Try again** (new attempt) and **Choose another method**. |
| `needs_review` | "We're verifying your payment. If you were charged you don't need to pay again." |
The `ref` is `orders.public_payment_ref` (unguessable); the status endpoint returns **only** status and order number, never PII.

### 9.3 Admin
- Orders list shows a payment badge. Order detail: attempt timeline (events), amounts, Swich order ID, **Re-check status**, **Refund** (Phase 2) with amount + reason, refund history.
- Payments page: filters by status/date; highlights `needs_review`, attempts pending > 30 min.

### 9.4 Notifications
Order-paid confirmation and admin alerts for `needs_review` use the store's existing channels (email/WhatsApp). Triggered only from the outbox row created by the paid transition.

---

## 10. Security requirements

| # | Requirement |
|---|---|
| S1 | `SWICH_CLIENT_SECRET`, `SWICH_SECRET_KEY`, AES material, service-role key: server env only, never logged, never sent to the client, never committed. Sandbox and production secrets are separate. |
| S2 | Callback authenticity = valid HMAC. Constant-time comparison. Reject and log invalid ones (rate-limit by IP). |
| S3 | Amount, currency and payer are derived from the DB on initiate and **re-checked** on callback; mismatches never mark paid. |
| S4 | The redirect is informational only. Status shown to the user always comes from our DB. |
| S5 | Card data is entered on Swich's hosted page only; the store stores no PAN/CVV. |
| S6 | Logs/events: redact tokens, secrets and checksums; mask MSISDN/email (`0345****567`). `payment_events.payload` stores a sanitised copy. |
| S7 | RLS on all payment tables; writes only via service role / security-definer functions; function execution revoked from `anon`/`authenticated`. |
| S8 | Initiate endpoint rate-limited (e.g. 10/min per user/IP); refund endpoint admin-only with audit trail (`payment_events` source `admin`). |
| S9 | Cron endpoint requires `CRON_SECRET`. Fixed-IP gateway requires signed requests and allow-lists only the Swich paths it needs. |
| S10 | GET mode exposes payer PII in the URL; mitigate with `Referrer-Policy: no-referrer` on checkout, and switch to POST mode for production when AES details are confirmed (D2). |
| S11 | HTTPS only. For POST mode set CSP `form-action` to include only the Swich POST host. |
| S12 | Pin and review all dependencies used for crypto; use Node's built-in `crypto` only. |

---

## 11. Error handling and response codes

`codes.ts` maps `(endpoint, code, message)` → `{ kind, retryable, userMessage, alertOps }`. Defaults below; key on code **and** message because several codes overlap.

| Codes | Kind | User-facing behaviour | Ops |
|---|---|---|---|
| `0000`, `00001` | success | proceed | — |
| `0001` duplicate transaction id | bug | silently create a new attempt and retry **once** (only on initiate paths where no money moved) | alert if repeated |
| `0002`, `0008`, `0012`, `0013`, `0014` (bundle) | validation | "Please check your details / amount." | log |
| `0003`, `0027` IP issues; `0004`, `0005`, `0026` client/account; `0007` vendor credentials/route; `0010`, `0015`–`0018`, `0028` channel/category/bank config; `0009` SYSTEM_ERROR | integration/config | "Payment is temporarily unavailable. Please try another method." | **page on-call** |
| `0011`, `0019`–`0023` blocked user/MSISDN/CNIC/account/card/failed attempts | blocked | "We couldn't process this payment. Please use another method or contact support." | log |
| `0024`, `0025` per-day limits | limit | "Daily limit reached. Try again tomorrow or use another method." | log |
| `0031` (many messages: issuer declined, insufficient balance, 3DS declined, expired card, limits…) | issuer/bank decline | show the provider message when it is customer-safe; offer retry/another card | none |
| `9900` failed at vendor / OTP failed / invalid OTP | vendor failure | "The bank/wallet didn't confirm. Try again." — retryable | metric |
| HTTP `401` | auth | refetch token once, retry GET/POST-prior-to-money-movement; else config alert | alert |
| HTTP `400` | request | treat as validation/vendor failure per body | log |
| HTTP `500`/`502`, network timeout | transient | GET: retry ×2. POST that moves money: **Inquire first**, never blind-retry. | metric |

---

## 12. Observability

- **Structured logs** per event with `customerTransactionId`, `orderId`, `attemptId`, `route`, `latencyMs`, `swichCode` — no secrets/PII.
- **Metrics/alerts:** attempts by status per hour; success rate by `payment_type`; callbacks with invalid checksum (alert > 5/10 min); attempts pending > 30 min (alert > 0 after reconcile runs); `needs_review` count (alert > 0); Swich auth failures (alert on any); refund failures.
- **Admin-visible audit:** every state change has a `payment_events` row.

---

## 13. Test plan

### 13.1 Unit tests
- `checksum.ts`: deterministic vectors for landing and callback (generate vectors with a known test key and an independent implementation, e.g. `openssl dgst -sha256 -hmac`); tamper cases; variant amount formats; timing-safe compare.
- `landing.ts`: item sanitising, ≤ 50-char transaction IDs, MSISDN normalisation (`+923451234567`, `923451234567`, `03451234567` → `03451234567`), URL encoding vs checksum on raw values.
- `status-map.ts`: every status in §7.8 incl. casing/whitespace/unknown.
- `codes.ts`: representative codes/messages incl. overlapping ones (`0009`, `0014`).
- `auth.ts`: caching, refresh margin, single-flight, 401 refetch.

### 13.2 Integration tests (against Supabase local + mocked Swich)
- `apply_payment_status`: concurrent callbacks (10 parallel) → one transition; paid never downgraded; amount mismatch → `needs_review`; late success after `expired` → paid + `needs_review`.
- Callback route: valid, invalid checksum, duplicate (same query twice), unknown transaction, out-of-order (`success` then `pending`).
- Initiate route: ownership, already paid, amount range, reuse rule, rate limit, feature flag off.
- Reconcile route: auth, pending → paid, pending → expired, Swich down.
- Refund route: full, partial, over-amount, double-click, `0009`, timeout-then-inquire.

### 13.3 Sandbox end-to-end checklist (manual, with Swich sandbox)
1. Pay successfully → callback arrives → order paid → email once → return page shows success.
2. Fail a payment → order remains payable → retry with a **new** transaction ID succeeds.
3. Close the tab after paying → order still ends as paid.
4. Abandon at the landing page → attempt expires via cron; stock released.
5. Replay the same callback URL manually → no duplicate side effects, still `200 {"status":"success"}`.
6. Tamper one character of `Checksum` / `Amount` → rejected.
7. Order of exactly 10, 10.01, 50,000, 50,000.01 PKR → confirm limit behaviour and record in §16.
8. Observe callback retry behaviour by making the endpoint return 500 once.
9. Token expiry mid-session (force-expire cached token) → transparent refresh.
10. Refund full and partial (Phase 2); verify Inquire shows `refund` / `partial refund`.

---

## 14. Implementation plan (phased, with acceptance criteria)

### Phase 0 — Prerequisites (before coding; owner: you)
- [ ] Obtain sandbox **and** production `client_id`, `client_secret`, **SecretKey**, and AES keys (if POST mode).
- [ ] Register the **callback URL** and the **redirect (success) URL** with Swich for each environment (or confirm the per-request `successRedirectUrl` is enough).
- [ ] Ask Swich the questions in §16.
- [ ] Decide hosting for the **fixed-IP service** (D3) — needed for refunds and all direct methods.
- [ ] Confirm which payment methods are enabled on your Swich account and the `transactionType` values.

### Phase 1 — Hosted checkout MVP (P0)
| Task | Description | Acceptance criteria |
|---|---|---|
| T1.1 | Migration §7 (tables, enums, RLS, `apply_payment_status`) | Migration applies cleanly on a fresh DB; RLS blocks anon/auth writes; function tests pass. |
| T1.2 | `config.ts` + env validation (zod), URL derivation, feature flag | App fails fast on missing/invalid env; sandbox/prod chosen by `SWICH_ENV` only. |
| T1.3 | `checksum.ts`, `landing.ts` (GET builder; POST builder stubbed behind flag) | All unit tests in §13.1 pass. |
| T1.4 | `auth.ts` + `http.ts` + `inquire.ts` | Token cached and refreshed; Inquire returns typed result against sandbox. |
| T1.5 | `initiate` route + checkout UI wiring | Clicking Pay redirects to the sandbox landing page with a valid checksum; double-click doesn't create duplicates. |
| T1.6 | `callback` route | Sandbox success marks the order paid exactly once; invalid checksum is rejected; always returns the required JSON on authentic calls. |
| T1.7 | Return page + `payment-status` endpoint | Shows all states in §9.2; never uses query params as truth. |
| T1.8 | Outbox/side-effects on the paid transition | One confirmation per order under repeated callbacks. |
| T1.9 | Minimal reconcile cron | Pending attempts older than 10 min resolve via Inquire. |
| T1.10 | Logging/redaction + feature flag kill-switch | No secrets/PII in logs; setting `SWICH_ENABLED=false` hides the option instantly. |
**Phase 1 exit:** §13.3 items 1–9 pass in sandbox; go-live checklist (§15) complete.

### Phase 2 — Operations (P1)
| Task | Description | Acceptance criteria |
|---|---|---|
| T2.1 | Fixed-IP gateway service (or Static IPs) + signed proxy client | Whitelisted IP confirmed with Swich; a test refund call from the app succeeds via the proxy. |
| T2.2 | Refund API + admin UI | Full/partial refunds work; over-refund blocked; double-click safe; history visible. |
| T2.3 | Admin Payments view + Re-check button | Admin can find any attempt and force an Inquire. |
| T2.4 | Daily re-verification job + alerting rules (§12) | Alerts fire in a staged failure drill. |

### Phase 3 — Direct methods (P2, optional, one method at a time)
Order of value: **Easypaisa/JazzCash** → **Raast QR** → **RTP** → **Bank transfer** → **1Bill**. For each: UI, `methods/<x>.ts`, state handling, sandbox E2E, and acceptance criteria "paid exactly once via callback, abandon path cancels (where an API exists), expiry honoured".

### Phase 4 — Recurring card payments (P2, optional)
Landing page with `isRecurringPayment=true` (+ `recurringPaymentType` as agreed), store only Swich's token indirection (the app keeps just the customer's MSISDN used at registration; the **instrument token is fetched via Get Instrument and never persisted** unless Swich confirms it is safe to store `[VERIFY]`), scheduled charges via `purchase/card/recurring`, failure/dunning flow, customer cancel flow. Requires explicit product definition before building.

---

## 15. Go-live and rollback

**Go-live checklist**
- [ ] Production env vars set; `SWICH_ENV=production`; secrets rotated from sandbox values.
- [ ] Callback and redirect URLs registered for production; callback reachable publicly over HTTPS (test with `curl`).
- [ ] Fixed IP whitelisted (if refunds/direct methods are enabled).
- [ ] Cron scheduled and authenticated.
- [ ] Alerts configured (§12) and routed to a real channel.
- [ ] Smoke test: one real low-value order (≥ minimum amount) end-to-end, then refund it (if refunds enabled).
- [ ] Support runbook: how to find a payment, re-check status, refund, handle `needs_review`.

**Rollback:** set `SWICH_ENABLED=false` (hides the method; in-flight attempts still complete via callback/cron). No data migration rollback needed — tables are additive.

---

## 16. Open questions for Swich (`[VERIFY]` items)

1. **Amount limits:** is 10.00 inclusive? Is 50,000.00 the hard cap for the landing page, and do limits differ per method/merchant? What is the recommended handling for larger orders?
2. **Amount string format** in the callback checksum (`10` / `10.00` / `10.0000`).
3. Is the checksum **SecretKey** the same as `client_secret`?
4. **AES parameters** for POST mode: algorithm/mode (CBC/GCM?), key and IV encoding, padding, ciphertext encoding.
5. **Callback registration:** where is the URL configured (portal vs. Swich staff)? Are separate callbacks sent for `pending` → `success`? Source IPs to allow-list?
6. **Redirect:** does the redirect append any query parameters? What happens on failure/cancel (no redirect is documented)?
7. **Session lifetime:** how long a landing-page transaction can remain `pending` before `block/expired`?
8. **Methods on the landing page:** exact list, and the `transactionType` values needed for QR/RTP.
9. **`categoryId`** values per payment option (e-wallet category is not given).
10. **IP whitelisting:** does Inquire (and the landing GET/POST) require it? Is a static IP from a serverless platform acceptable?
11. **Refunds:** which methods are refundable; are refund results also sent by callback; refund timelines; idempotency support.
12. **Currency:** is USD usable on the landing page, and for which methods?
13. **Rate limits** on the token and Inquire endpoints.
14. Recurring cards: token storage policy and failure/retry handling.
15. Is the `Status` value `block/expired` literally that string in callbacks?

---

## Appendix A — Environment variables

```bash
# --- Swich core ---
SWICH_ENABLED=true
SWICH_ENV=sandbox                      # sandbox | production
SWICH_CLIENT_ID=
SWICH_CLIENT_SECRET=
SWICH_SECRET_KEY=                      # HMAC key for checksums [VERIFY: same as client secret?]
# Optional overrides (otherwise derived from SWICH_ENV, see §4.1)
SWICH_API_BASE_URL=
SWICH_AUTH_URL=
SWICH_PWA_URL=
SWICH_PWA_POST_URL=

# --- Behaviour ---
SWICH_LANDING_MODE=get                 # get | post
SWICH_AES_KEY=                         # POST mode only
SWICH_AES_IV=                          # POST mode only
SWICH_MIN_AMOUNT=10
SWICH_MAX_AMOUNT=50000
SWICH_ATTEMPT_TTL_MINUTES=60
SWICH_TRANSACTION_TYPE=                # only if Swich requires it on the landing page

# --- App ---
NEXT_PUBLIC_SITE_URL=https://your-store.example
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=

# --- Phase 2+ ---
FIXED_IP_GATEWAY_URL=
FIXED_IP_GATEWAY_SECRET=
```

## Appendix B — Reference snippets

**Checksums (Node)**
```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

const hmac = (key: string, msg: string) =>
  createHmac('sha256', key).update(msg, 'utf8').digest('hex');

export const landingChecksum = (key: string, txnId: string, item: string, amount: string) =>
  hmac(key, `Swich:${txnId}:${item}:${amount}`);

export const callbackChecksum = (key: string, txnId: string, orderId: string, amount: string, status: string) =>
  hmac(key, `SWCallback:${txnId}:${orderId}:${amount}:${status}`);

export const safeEqualHex = (a: string, b: string) => {
  const A = Buffer.from(a.toLowerCase(), 'hex'), B = Buffer.from(b.toLowerCase(), 'hex');
  return A.length === B.length && timingSafeEqual(A, B);
};
```

**Token request**
```ts
const body = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: cfg.clientId,
  client_secret: cfg.clientSecret,
});
const res = await fetch(cfg.authUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body,
});
// → { access_token, token_type: 'Bearer', expires_in: 3600 }
```

**Landing GET URL (example shape)**
```
https://sandbox-payin-pwa.swichnow.com/?clientId=<id>&customerTransactionId=<32-hex>&item=Order%20ORD1042
&amount=1250.00&channel=0&billReferenceNo=ORD1042&description=Payment%20for%20order%20ORD1042
&PayeeName=<name>&Email=<email>&MSISDN=03451234567&currency=PKR&checksum=<hex>
&successRedirectUrl=<urlencoded https://store/checkout/payment-return?ref=<publicRef>>
```

**Callback (example shape)**
```
GET /api/payments/swich/callback?PaymentType=<t>&Status=success&OrderId=SW24106
    &CustomerTransactionId=<32-hex>&Amount=1250.00&Checksum=<hex>
→ 200 {"status":"success"}
```

**Inquire**
```
GET {base}/gateway/payin/v2.0/inquire?CustomerTransactionId=<id>
Authorization: Bearer <token>
→ { transaction: { orderId, transactionStatus, amount, … }, status, code, message }
```
