-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Types
CREATE TYPE generation_type AS ENUM ('image', 'video');
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE transaction_type AS ENUM ('topup', 'deduction', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  balance       BIGINT NOT NULL DEFAULT 0,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generations
CREATE TABLE public.generations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            generation_type NOT NULL,
  status          generation_status NOT NULL DEFAULT 'pending',
  prompt          TEXT NOT NULL,
  parameters      JSONB NOT NULL DEFAULT '{}',
  cost_kopecks    INTEGER NOT NULL,
  job_id          TEXT,
  result_url      TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- Transactions
CREATE TABLE public.transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type                  transaction_type NOT NULL,
  status                transaction_status NOT NULL DEFAULT 'pending',
  amount_kopecks        BIGINT NOT NULL,
  balance_before        BIGINT NOT NULL DEFAULT 0,
  balance_after         BIGINT NOT NULL DEFAULT 0,
  description           TEXT,
  yookassa_payment_id   TEXT UNIQUE,
  yookassa_payment_url  TEXT,
  generation_id         UUID REFERENCES public.generations(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Model pricing
CREATE TABLE public.model_pricing (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id      TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  type          generation_type NOT NULL,
  cost_kopecks  INTEGER NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Pricing plans (top-up packages)
CREATE TABLE public.pricing_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  topup_kopecks   BIGINT NOT NULL,
  bonus_kopecks   BIGINT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_status ON public.generations(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_yookassa_id ON public.transactions(yookassa_payment_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_generations_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION on_auth_user_created();

-- Atomic balance deduction
CREATE OR REPLACE FUNCTION deduct_balance(
  p_user_id       UUID,
  p_amount        BIGINT,
  p_generation_id UUID,
  p_description   TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = p_user_id;

  INSERT INTO public.transactions (
    user_id, type, status, amount_kopecks,
    balance_before, balance_after,
    description, generation_id
  ) VALUES (
    p_user_id, 'deduction', 'completed', p_amount,
    v_balance, v_balance - p_amount,
    p_description, p_generation_id
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Atomic balance credit
CREATE OR REPLACE FUNCTION credit_balance(
  p_user_id       UUID,
  p_amount        BIGINT,
  p_yookassa_id   TEXT,
  p_description   TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance BIGINT;
BEGIN
  SELECT balance INTO v_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;

  UPDATE public.transactions
  SET
    status = 'completed',
    balance_before = v_balance,
    balance_after = v_balance + p_amount,
    updated_at = NOW()
  WHERE yookassa_payment_id = p_yookassa_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "generations_select_own" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "generations_insert_own" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_select_own" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "model_pricing_public_read" ON public.model_pricing
  FOR SELECT USING (TRUE);

CREATE POLICY "pricing_plans_public_read" ON public.pricing_plans
  FOR SELECT USING (TRUE);

-- Seed: model pricing
INSERT INTO public.model_pricing (model_id, display_name, type, cost_kopecks) VALUES
  ('wavespeed-ai/flux-dev', 'FLUX Dev (быстрое)', 'image', 500),
  ('wavespeed-ai/flux-dev:fp8', 'FLUX Dev FP8 (HD)', 'image', 800),
  ('wavespeed-ai/wan-t2v-480p', 'Wan T2V 480p', 'video', 5000),
  ('wavespeed-ai/wan-t2v-720p', 'Wan T2V 720p', 'video', 10000);

-- Seed: pricing plans
INSERT INTO public.pricing_plans (name, topup_kopecks, bonus_kopecks, sort_order) VALUES
  ('Старт', 50000, 0, 1),
  ('Базовый', 150000, 10000, 2),
  ('Про', 500000, 50000, 3);
