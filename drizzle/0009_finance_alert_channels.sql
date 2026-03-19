ALTER TABLE finance_settings
  ADD COLUMN IF NOT EXISTS email_alerts_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE finance_settings
  ADD COLUMN IF NOT EXISTS push_alerts_enabled boolean NOT NULL DEFAULT true;

ALTER TABLE finance_settings
  ADD COLUMN IF NOT EXISTS last_alert_sent_at timestamp;
