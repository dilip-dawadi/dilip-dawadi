CREATE TABLE IF NOT EXISTS finance_work_logs (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  todo_id text REFERENCES todos(id) ON DELETE SET NULL,
  work_date timestamp NOT NULL,
  minutes_worked integer NOT NULL,
  hourly_rate_cents integer NOT NULL,
  note text,
  income_transaction_id text REFERENCES finance_transactions(id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_work_logs_user
  ON finance_work_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_finance_work_logs_work_date
  ON finance_work_logs(work_date);

CREATE INDEX IF NOT EXISTS idx_finance_work_logs_todo
  ON finance_work_logs(todo_id);
