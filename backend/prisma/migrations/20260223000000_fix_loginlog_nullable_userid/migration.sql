-- AlterTable: userId in login_logs auf nullable setzen (FK-Verletzungs-Fix)
-- und username-Spalte für fehlgeschlagene Versuche unbekannter Nutzer hinzufügen

ALTER TABLE "login_logs" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "login_logs" DROP CONSTRAINT "login_logs_userId_fkey";

ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "login_logs" ADD COLUMN "username" TEXT;
