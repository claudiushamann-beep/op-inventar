# OP-Sieb Inventarmanagement-System

Ein Web-basiertes Inventarmanagement-System für OP-Siebe im Krankenhaus.

## Features

- **Sieb-Verwaltung**: Anlegen, Bearbeiten und Archivieren von OP-Sieben
- **Instrumenten-Katalog**: Verwaltung von Instrumenten mit Hersteller-Informationen
- **Fachabteilungs-Siebe**: Fachabteilungsspezifische und fachübergreifende Siebe
- **Änderungsworkflow**: Validierungssystem mit Freigabe durch Chefarzt/OP-Manager
- **Rollenbasierte Zugriffskontrolle**: 5 verschiedene Benutzerrollen
- **Bild-Upload**: Bilder von gepackten Sieben und Instrumenten

## Technologien

- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Datenbank**: PostgreSQL + Prisma ORM
- **Authentifizierung**: JWT (später Active Directory)
- **Containerisierung**: Docker + Docker Compose

## Rollen & Berechtigungen

| Rolle | Siebe anlegen | Siebe bearbeiten | Änderungen beantragen | Änderungen genehmigen |
|-------|:-------------:|:----------------:|:---------------------:|:---------------------:|
| OP-Pflege | ✗ | ✗ | ✓ | ✗ |
| Oberarzt | ✓ | ✓ | ✓ | ✗ |
| Chefarzt | ✓ | ✓ | ✓ | ✓ (fachabteilungsspez.) |
| OP-Manager | ✓ | ✓ | ✓ | ✓ (alle) |
| AEMP-Mitarbeiter | ✓ | ✓ | ✓ | ✗ |

## Installation

### Voraussetzungen

- Node.js 20+
- PostgreSQL 16+ oder Docker
- npm oder yarn

### Entwicklungsumgebung

1. Repository klonen:
```bash
git clone <repository-url>
cd op-inventar
```

2. Backend einrichten:
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

3. Frontend einrichten (neues Terminal):
```bash
cd frontend
npm install
npm run dev
```

4. Anwendung öffnen: http://localhost:5173

### Test-User (Passwort: password123)

- `admin` - OP-Manager
- `chef_chi` - Chefarzt Chirurgie
- `chef_ort` - Chefarzt Orthopädie
- `oberarzt1` - Oberarzt
- `oppflege1` - OP-Pflege
- `aemp1` - AEMP-Mitarbeiter

### Docker Deployment

```bash
docker-compose up -d
```

Die Anwendung ist dann unter http://localhost erreichbar.

## API-Endpunkte

### Authentifizierung
- `POST /api/auth/login` - Anmeldung
- `GET /api/auth/me` - Aktueller Benutzer
- `POST /api/auth/register` - Neuen Benutzer anlegen

### Siebe
- `GET /api/siebe` - Alle Siebe
- `GET /api/siebe/:id` - Sieb-Details
- `POST /api/siebe` - Sieb erstellen
- `PUT /api/siebe/:id` - Sieb aktualisieren
- `POST /api/siebe/:id/instrumente` - Instrument hinzufügen
- `POST /api/siebe/:id/bild` - Bild hochladen

### Änderungen
- `GET /api/aenderungen` - Alle Änderungen
- `GET /api/aenderungen/pending` - Offene Änderungen
- `POST /api/aenderungen` - Änderung beantragen
- `POST /api/aenderungen/:id/approve` - Genehmigen
- `POST /api/aenderungen/:id/reject` - Ablehnen

## Projektstruktur

```
op-inventar/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request-Handler
│   │   ├── middleware/     # Auth & RBAC
│   │   ├── routes/         # API-Routen
│   │   └── utils/          # Hilfsfunktionen
│   ├── prisma/
│   │   └── schema.prisma   # Datenbank-Schema
│   └── uploads/            # Hochgeladene Dateien
├── frontend/
│   ├── src/
│   │   ├── components/     # React-Komponenten
│   │   ├── pages/          # Seiten
│   │   ├── context/        # React Context
│   │   └── utils/          # API-Client
│   └── public/
└── docker-compose.yml
```

## Lizenz

Proprietär - Nur für interne Nutzung im Krankenhaus.
