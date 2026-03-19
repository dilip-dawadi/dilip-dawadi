CREATE TABLE IF NOT EXISTS finance_transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'expense',
  amount_cents integer NOT NULL,
  category text NOT NULL,
  note text,
  happened_at timestamp NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurring_interval text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user
  ON finance_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_happened_at
  ON finance_transactions(happened_at);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_type
  ON finance_transactions(type);

CREATE TABLE IF NOT EXISTS finance_settings (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  monthly_limit_cents integer NOT NULL DEFAULT 0,
  daily_limit_cents integer NOT NULL DEFAULT 0,
  monthly_savings_target_cents integer NOT NULL DEFAULT 0,
  notify_threshold_percent integer NOT NULL DEFAULT 80,
  smart_alerts_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_settings_user
  ON finance_settings(user_id);
