CREATE TABLE IF NOT EXISTS finance_receivables (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  todo_id text REFERENCES todos(id) ON DELETE SET NULL,
  work_log_id text REFERENCES finance_work_logs(id) ON DELETE SET NULL,
  payer_name text NOT NULL,
  payer_email text,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  group_key text,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  due_at timestamp,
  note text,
  minutes_worked integer,
  hourly_rate_cents integer,
  include_work_details boolean NOT NULL DEFAULT false,
  paid_at timestamp,
  income_transaction_id text REFERENCES finance_transactions(id) ON DELETE SET NULL,
  last_reminder_sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_receivables_user
  ON finance_receivables(user_id);

CREATE INDEX IF NOT EXISTS idx_finance_receivables_status
  ON finance_receivables(status);

CREATE INDEX IF NOT EXISTS idx_finance_receivables_due
  ON finance_receivables(due_at);

CREATE INDEX IF NOT EXISTS idx_finance_receivables_payer
  ON finance_receivables(payer_name);

CREATE INDEX IF NOT EXISTS idx_finance_receivables_group
  ON finance_receivables(group_key);
