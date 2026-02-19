import { PrismaClient, Rolle } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwortHash = await bcrypt.hash('password123', 10);

  const fachabteilungen = await Promise.all([
    prisma.fachabteilung.upsert({
      where: { kuerzel: 'CHI' },
      update: {},
      create: {
        name: 'Chirurgie',
        kuerzel: 'CHI',
        beschreibung: 'Allgemeine Chirurgie'
      }
    }),
    prisma.fachabteilung.upsert({
      where: { kuerzel: 'ORT' },
      update: {},
      create: {
        name: 'Orthopädie',
        kuerzel: 'ORT',
        beschreibung: 'Orthopädie und Unfallchirurgie'
      }
    }),
    prisma.fachabteilung.upsert({
      where: { kuerzel: 'GYN' },
      update: {},
      create: {
        name: 'Gynäkologie',
        kuerzel: 'GYU',
        beschreibung: 'Gynäkologie und Geburtshilfe'
      }
    }),
    prisma.fachabteilung.upsert({
      where: { kuerzel: 'URO' },
      update: {},
      create: {
        name: 'Urologie',
        kuerzel: 'URO',
        beschreibung: 'Urologie'
      }
    }),
    prisma.fachabteilung.upsert({
      where: { kuerzel: 'HNO' },
      update: {},
      create: {
        name: 'HNO',
        kuerzel: 'HNO',
        beschreibung: 'Hals-Nasen-Ohren-Heilkunde'
      }
    })
  ]);

  console.log('Fachabteilungen erstellt');

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@hospital.de',
        passwortHash,
        vorname: 'System',
        nachname: 'Admin',
        rolle: Rolle.OP_MANAGER
      }
    }),
    prisma.user.upsert({
      where: { username: 'chef_chi' },
      update: {},
      create: {
        username: 'chef_chi',
        email: 'chef.chi@hospital.de',
        passwortHash,
        vorname: 'Max',
        nachname: 'Müller',
        rolle: Rolle.CHEFARZT,
        fachabteilungId: fachabteilungen[0].id
      }
    }),
    prisma.user.upsert({
      where: { username: 'chef_ort' },
      update: {},
      create: {
        username: 'chef_ort',
        email: 'chef.ort@hospital.de',
        passwortHash,
        vorname: 'Anna',
        nachname: 'Schmidt',
        rolle: Rolle.CHEFARZT,
        fachabteilungId: fachabteilungen[1].id
      }
    }),
    prisma.user.upsert({
      where: { username: 'oberarzt1' },
      update: {},
      create: {
        username: 'oberarzt1',
        email: 'oberarzt1@hospital.de',
        passwortHash,
        vorname: 'Thomas',
        nachname: 'Weber',
        rolle: Rolle.OBERARZT,
        fachabteilungId: fachabteilungen[0].id
      }
    }),
    prisma.user.upsert({
      where: { username: 'oppflege1' },
      update: {},
      create: {
        username: 'oppflege1',
        email: 'oppflege1@hospital.de',
        passwortHash,
        vorname: 'Maria',
        nachname: 'Fischer',
        rolle: Rolle.OP_PFLEGE
      }
    }),
    prisma.user.upsert({
      where: { username: 'aemp1' },
      update: {},
      create: {
        username: 'aemp1',
        email: 'aemp1@hospital.de',
        passwortHash,
        vorname: 'Peter',
        nachname: 'Wagner',
        rolle: Rolle.AEMP_MITARBEITER
      }
    })
  ]);

  console.log('Users erstellt');

  await Promise.all([
    prisma.fachabteilung.update({
      where: { id: fachabteilungen[0].id },
      data: { chefArztId: users[1].id }
    }),
    prisma.fachabteilung.update({
      where: { id: fachabteilungen[1].id },
      data: { chefArztId: users[2].id }
    })
  ]);

  const hersteller = await Promise.all([
    prisma.hersteller.upsert({
      where: { name: 'Aesculap' },
      update: {},
      create: {
        name: 'Aesculap',
        website: 'https://www.aesculap.de',
        kontaktEmail: 'info@aesculap.de'
      }
    }),
    prisma.hersteller.upsert({
      where: { name: 'Medtronic' },
      update: {},
      create: {
        name: 'Medtronic',
        website: 'https://www.medtronic.com',
        kontaktEmail: 'info@medtronic.com'
      }
    }),
    prisma.hersteller.upsert({
      where: { name: 'Karl Storz' },
      update: {},
      create: {
        name: 'Karl Storz',
        website: 'https://www.karlstorz.com',
        kontaktEmail: 'info@karlstorz.de'
      }
    })
  ]);

  console.log('Hersteller erstellt');

  const instrumente = await Promise.all([
    prisma.instrument.upsert({
      where: { artikelNr_herstellerId: { artikelNr: 'SK701', herstellerId: hersteller[0].id } },
      update: {},
      create: {
        artikelNr: 'SK701',
        bezeichnung: 'Skalpell Nr. 10',
        beschreibung: 'Steriles Skalpell mit Edelstahlklinge',
        herstellerId: hersteller[0].id
      }
    }),
    prisma.instrument.upsert({
      where: { artikelNr_herstellerId: { artikelNr: 'PI104', herstellerId: hersteller[0].id } },
      update: {},
      create: {
        artikelNr: 'PI104',
        bezeichnung: 'Pinzette anatomisch 14cm',
        beschreibung: 'Anatomische Pinzette, Edelstahl',
        herstellerId: hersteller[0].id
      }
    }),
    prisma.instrument.upsert({
      where: { artikelNr_herstellerId: { artikelNr: 'SC203', herstellerId: hersteller[0].id } },
      update: {},
      create: {
        artikelNr: 'SC203',
        bezeichnung: 'Schere Cooper 14cm',
        beschreibung: 'Chirurgische Schere, gerade',
        herstellerId: hersteller[0].id
      }
    }),
    prisma.instrument.upsert({
      where: { artikelNr_herstellerId: { artikelNr: 'KL301', herstellerId: hersteller[0].id } },
      update: {},
      create: {
        artikelNr: 'KL301',
        bezeichnung: 'Klemme nach Mosquito 12cm',
        beschreibung: 'Gerade Arterienklemme',
        herstellerId: hersteller[0].id
      }
    }),
    prisma.instrument.upsert({
      where: { artikelNr_herstellerId: { artikelNr: 'NA501', herstellerId: hersteller[0].id } },
      update: {},
      create: {
        artikelNr: 'NA501',
        bezeichnung: 'Nadelhalter Mayo-Hegar 16cm',
        beschreibung: 'Nadelhalter mit Tungsten-Keramik-Einsatz',
        herstellerId: hersteller[0].id
      }
    }),
    prisma.instrument.upsert({
      where: { artikelNr_herstellerId: { artikelNr: 'RE101', herstellerId: hersteller[0].id } },
      update: {},
      create: {
        artikelNr: 'RE101',
        bezeichnung: 'Retrakter Langenbeck 22mm',
        beschreibung: 'Wundhaken nach Langenbeck',
        herstellerId: hersteller[0].id
      }
    })
  ]);

  console.log('Instrumente erstellt');

  const sieb = await prisma.sieb.create({
    data: {
      name: 'Standard-Sieb Bauch',
      beschreibung: 'Basisset für abdominelle Eingriffe',
      typ: 'FACHUEBERGREIFEND',
      status: 'AKTIV',
      erstelltVonId: users[0].id,
      fachabteilungId: null
    }
  });

  await prisma.siebInhalt.createMany({
    data: [
      { siebId: sieb.id, instrumentId: instrumente[0].id, anzahl: 2, position: 'A1' },
      { siebId: sieb.id, instrumentId: instrumente[1].id, anzahl: 4, position: 'A2' },
      { siebId: sieb.id, instrumentId: instrumente[2].id, anzahl: 2, position: 'B1' },
      { siebId: sieb.id, instrumentId: instrumente[3].id, anzahl: 6, position: 'B2' },
      { siebId: sieb.id, instrumentId: instrumente[4].id, anzahl: 2, position: 'C1' },
      { siebId: sieb.id, instrumentId: instrumente[5].id, anzahl: 2, position: 'C2' }
    ]
  });

  console.log('Beispiel-Sieb erstellt');

  console.log('Seeding abgeschlossen!');
  console.log('\nTest-User (Passwort: password123):');
  console.log('- admin (OP-Manager)');
  console.log('- chef_chi (Chefarzt Chirurgie)');
  console.log('- chef_ort (Chefarzt Orthopädie)');
  console.log('- oberarzt1 (Oberarzt)');
  console.log('- oppflege1 (OP-Pflege)');
  console.log('- aemp1 (AEMP-Mitarbeiter)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
