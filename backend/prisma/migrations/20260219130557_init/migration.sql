-- CreateEnum
CREATE TYPE "Rolle" AS ENUM ('OP_PFLEGE', 'OBERARZT', 'CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER');

-- CreateEnum
CREATE TYPE "SiebTyp" AS ENUM ('FACHABTEILUNGSSPEZIFISCH', 'FACHUEBERGREIFEND');

-- CreateEnum
CREATE TYPE "SiebStatus" AS ENUM ('ENTWURF', 'AKTIV', 'INAKTIV', 'ARCHIVIERT');

-- CreateEnum
CREATE TYPE "AenderungStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AenderungTyp" AS ENUM ('ADD_INSTRUMENT', 'REMOVE_INSTRUMENT', 'MODIFY_ANZAHL', 'MODIFY_POSITION', 'CREATE_SIEB', 'DEACTIVATE_SIEB');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwortHash" TEXT NOT NULL,
    "rolle" "Rolle" NOT NULL,
    "vorname" TEXT NOT NULL,
    "nachname" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "adSid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fachabteilungId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAdresse" TEXT,
    "erfolg" BOOLEAN NOT NULL,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fachabteilungen" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kuerzel" TEXT NOT NULL,
    "beschreibung" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chefArztId" TEXT,

    CONSTRAINT "fachabteilungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hersteller" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "katalogPfad" TEXT,
    "website" TEXT,
    "kontaktEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hersteller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instrumente" (
    "id" TEXT NOT NULL,
    "artikelNr" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "beschreibung" TEXT,
    "bildPfad" TEXT,
    "herstellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instrumente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siebe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "beschreibung" TEXT,
    "typ" "SiebTyp" NOT NULL,
    "status" "SiebStatus" NOT NULL DEFAULT 'ENTWURF',
    "version" INTEGER NOT NULL DEFAULT 1,
    "bildGepacktPfad" TEXT,
    "fachabteilungId" TEXT,
    "erstelltVonId" TEXT NOT NULL,
    "freigabeAm" TIMESTAMP(3),
    "freigabeVonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siebe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sieb_inhalte" (
    "id" TEXT NOT NULL,
    "siebId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "anzahl" INTEGER NOT NULL DEFAULT 1,
    "position" TEXT,
    "hinweis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sieb_inhalte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aenderungen" (
    "id" TEXT NOT NULL,
    "siebId" TEXT NOT NULL,
    "typ" "AenderungTyp" NOT NULL,
    "altDaten" JSONB,
    "neuDaten" JSONB NOT NULL,
    "kommentar" TEXT,
    "status" "AenderungStatus" NOT NULL DEFAULT 'PENDING',
    "beantragtVonId" TEXT NOT NULL,
    "beantragtAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "genehmigtVonId" TEXT,
    "genehmigtAm" TIMESTAMP(3),
    "ablehnungsGrund" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aenderungen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "katalog_importe" (
    "id" TEXT NOT NULL,
    "herstellerId" TEXT NOT NULL,
    "dateiPfad" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "anzahlInstrumente" INTEGER NOT NULL DEFAULT 0,
    "fehler" TEXT,
    "erstelltVon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "katalog_importe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "fachabteilungen_name_key" ON "fachabteilungen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fachabteilungen_kuerzel_key" ON "fachabteilungen"("kuerzel");

-- CreateIndex
CREATE UNIQUE INDEX "fachabteilungen_chefArztId_key" ON "fachabteilungen"("chefArztId");

-- CreateIndex
CREATE UNIQUE INDEX "hersteller_name_key" ON "hersteller"("name");

-- CreateIndex
CREATE UNIQUE INDEX "instrumente_artikelNr_herstellerId_key" ON "instrumente"("artikelNr", "herstellerId");

-- CreateIndex
CREATE UNIQUE INDEX "sieb_inhalte_siebId_instrumentId_key" ON "sieb_inhalte"("siebId", "instrumentId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_fachabteilungId_fkey" FOREIGN KEY ("fachabteilungId") REFERENCES "fachabteilungen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fachabteilungen" ADD CONSTRAINT "fachabteilungen_chefArztId_fkey" FOREIGN KEY ("chefArztId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instrumente" ADD CONSTRAINT "instrumente_herstellerId_fkey" FOREIGN KEY ("herstellerId") REFERENCES "hersteller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siebe" ADD CONSTRAINT "siebe_fachabteilungId_fkey" FOREIGN KEY ("fachabteilungId") REFERENCES "fachabteilungen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siebe" ADD CONSTRAINT "siebe_erstelltVonId_fkey" FOREIGN KEY ("erstelltVonId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sieb_inhalte" ADD CONSTRAINT "sieb_inhalte_siebId_fkey" FOREIGN KEY ("siebId") REFERENCES "siebe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sieb_inhalte" ADD CONSTRAINT "sieb_inhalte_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instrumente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aenderungen" ADD CONSTRAINT "aenderungen_siebId_fkey" FOREIGN KEY ("siebId") REFERENCES "siebe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aenderungen" ADD CONSTRAINT "aenderungen_beantragtVonId_fkey" FOREIGN KEY ("beantragtVonId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aenderungen" ADD CONSTRAINT "aenderungen_genehmigtVonId_fkey" FOREIGN KEY ("genehmigtVonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "katalog_importe" ADD CONSTRAINT "katalog_importe_herstellerId_fkey" FOREIGN KEY ("herstellerId") REFERENCES "hersteller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
