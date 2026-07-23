-- Server-authoritative per-question timer: records when the current step's
-- question was served, so a late answer can be rejected as a timeout.
ALTER TABLE "ShowRun" ADD COLUMN "stepStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
