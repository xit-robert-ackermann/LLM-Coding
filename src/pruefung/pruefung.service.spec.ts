import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { PruefungService } from './pruefung.service';
import { VormerkungService } from '../vormerkung/vormerkung.service';
import { FixedDateSource } from '../common/fixed-date-source';
import {
  AusleiheNichtGefundenError,
  GegenstandNichtInPruefungError,
  EingabeUngueltigError,
  AbzugUebersteigtKautionError,
} from '../errors/domain-errors';

const ZUSTANDSWECHSEL_DDL = `CREATE TABLE zustandswechsel (id TEXT PRIMARY KEY, gegenstand_id TEXT NOT NULL, von_status TEXT NOT NULL, nach_status TEXT NOT NULL, grund TEXT NOT NULL, zeitstempel TEXT NOT NULL);`;

function makeDb() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE kategorie (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, leihdauer_tage INTEGER NOT NULL, wartungsintervall_ausleihen INTEGER NOT NULL, einweisungspflichtig INTEGER NOT NULL);
    CREATE TABLE gegenstand (inventarnummer TEXT PRIMARY KEY, kategorie_id TEXT NOT NULL, wiederbeschaffungswert_euro INTEGER NOT NULL, nutzungszaehler INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'VERFUEGBAR');
    CREATE TABLE mitglied (id TEXT PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE ausleihe (id TEXT PRIMARY KEY, gegenstand_id TEXT NOT NULL, mitglied_id TEXT NOT NULL, ausgabe_datum TEXT NOT NULL, rueckgabe_frist TEXT NOT NULL, verlaengert INTEGER NOT NULL DEFAULT 0, auffaelligkeiten TEXT, status TEXT NOT NULL DEFAULT 'OFFEN');
    CREATE TABLE pruefprotokoll (id TEXT PRIMARY KEY, ausleihe_id TEXT NOT NULL UNIQUE, ergebnis TEXT NOT NULL, kautionsabzug_euro INTEGER NOT NULL DEFAULT 0, notiz TEXT, erstellt_am TEXT NOT NULL);
    CREATE TABLE kautionsbewegung (id TEXT PRIMARY KEY, ausleihe_id TEXT NOT NULL, typ TEXT NOT NULL, betrag_euro INTEGER NOT NULL, zeitstempel TEXT NOT NULL, ausloeserId TEXT NOT NULL);
    CREATE TABLE vormerkung (id TEXT PRIMARY KEY, mitglied_id TEXT NOT NULL, kategorie_id TEXT NOT NULL, eingangszeit TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'WARTEND');
    CREATE TABLE reservierung (id TEXT PRIMARY KEY, gegenstand_id TEXT NOT NULL, mitglied_id TEXT NOT NULL, entstanden_am TEXT NOT NULL, verfaellt_am TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'AKTIV');
    CREATE TABLE einweisung (id TEXT PRIMARY KEY, mitglied_id TEXT NOT NULL, kategorie_id TEXT NOT NULL, dokumentiert_am TEXT NOT NULL);
    ${ZUSTANDSWECHSEL_DDL}
  `);
  return drizzle(sqlite, { schema });
}

function makeService(date = new Date('2024-06-01')) {
  const db = makeDb() as any;
  const dateSource = new FixedDateSource(date);
  const vormerkungService = new VormerkungService(db, dateSource);
  return { svc: new PruefungService(db, dateSource, vormerkungService), db };
}

// --- Seed helpers ---

function seedKategorie(db: any, overrides: any = {}) {
  const kat = {
    id: 'kat-1',
    name: 'Bohrmaschinen',
    leihdauerTage: 7,
    wartungsintervallAusleihen: 10,
    einweisungspflichtig: false,
    ...overrides,
  };
  db.insert(schema.kategorie).values(kat).run();
  return kat;
}

function seedGegenstand(db: any, overrides: any = {}) {
  const g = {
    inventarnummer: 'G-001',
    kategorieId: 'kat-1',
    wiederbeschaffungswertEuro: 200,
    nutzungszaehler: 0,
    status: 'IN_PRUEFUNG',
    ...overrides,
  };
  db.insert(schema.gegenstand).values(g).run();
  return g;
}

function seedMitglied(db: any) {
  const m = { id: 'M-001', name: 'Alice' };
  db.insert(schema.mitglied).values(m).run();
  return m;
}

function seedAusleihe(db: any, overrides: any = {}) {
  const a = {
    id: 'A-001',
    gegenstandId: 'G-001',
    mitgliedId: 'M-001',
    ausgabeDatum: '2024-05-01',
    rueckgabeFrist: '2024-05-08',
    verlaengert: false,
    status: 'OFFEN',
    ...overrides,
  };
  db.insert(schema.ausleihe).values(a).run();
  return a;
}

function seedKaution(db: any, ausleiheId = 'A-001', betrag = 100) {
  db.insert(schema.kautionsbewegung).values({
    id: crypto.randomUUID(),
    ausleiheId,
    typ: 'HINTERLEGUNG',
    betragEuro: betrag,
    zeitstempel: new Date().toISOString(),
    ausloeserId: 'system',
  }).run();
}

function seedAll(db: any, gegenstandOverrides: any = {}, kategorieOverrides: any = {}) {
  seedKategorie(db, kategorieOverrides);
  seedGegenstand(db, gegenstandOverrides);
  seedMitglied(db);
  seedAusleihe(db);
  seedKaution(db);
}

describe('PruefungService', () => {
  it('UC-04 OK: writes FREIGABE, closes Ausleihe, sets VERFUEGBAR, increments nutzungszaehler, writes zustandswechsel', () => {
    const { svc, db } = makeService();
    seedAll(db);

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'OK' });

    const ausleihe = db.select().from(schema.ausleihe).where(eq(schema.ausleihe.id, 'A-001')).get();
    expect(ausleihe?.status).toBe('ABGESCHLOSSEN');

    const gegenstand = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(gegenstand?.status).toBe('VERFUEGBAR');
    expect(gegenstand?.nutzungszaehler).toBe(1);

    const freigaben = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'FREIGABE'))).all();
    expect(freigaben).toHaveLength(1);
    expect(freigaben[0].betragEuro).toBe(100);

    const protokoll = db.select().from(schema.pruefprotokoll).where(eq(schema.pruefprotokoll.ausleiheId, 'A-001')).get();
    expect(protokoll?.ergebnis).toBe('OK');

    const wechsel = db.select().from(schema.zustandswechsel).all();
    expect(wechsel).toHaveLength(1);
    expect(wechsel[0].vonStatus).toBe('IN_PRUEFUNG');
    expect(wechsel[0].nachStatus).toBe('VERFUEGBAR');
  });

  it('UC-04 OK: nutzungszaehler reaches wartungsintervall → WARTUNGSFAELLIG', () => {
    const { svc, db } = makeService();
    // wartungsintervall = 2, nutzungszaehler starts at 1 → after increment = 2 = interval → WARTUNGSFAELLIG
    seedAll(db, { nutzungszaehler: 1 }, { wartungsintervallAusleihen: 2 });

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'OK' });

    const gegenstand = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(gegenstand?.status).toBe('WARTUNGSFAELLIG');
    expect(gegenstand?.nutzungszaehler).toBe(2);
  });

  it('UC-04 SCHADEN without abzug → throws EingabeUngueltigError', () => {
    const { svc, db } = makeService();
    seedAll(db);

    expect(() => svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'SCHADEN' }))
      .toThrow(EingabeUngueltigError);
  });

  it('UC-04 SCHADEN with valid abzug → writes ABZUG + FREIGABE', () => {
    const { svc, db } = makeService();
    seedAll(db);

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'SCHADEN', abzug: 30 });

    const abzuege = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'ABZUG'))).all();
    expect(abzuege).toHaveLength(1);
    expect(abzuege[0].betragEuro).toBe(30);

    const freigaben = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'FREIGABE'))).all();
    expect(freigaben).toHaveLength(1);
    expect(freigaben[0].betragEuro).toBe(70);

    const protokoll = db.select().from(schema.pruefprotokoll).where(eq(schema.pruefprotokoll.ausleiheId, 'A-001')).get();
    expect(protokoll?.kautionsabzugEuro).toBe(30);
  });

  it('UC-04 SCHADEN with abzug > kaution → throws AbzugUebersteigtKautionError (BR-021)', () => {
    const { svc, db } = makeService();
    seedAll(db);

    expect(() => svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'SCHADEN', abzug: 150 }))
      .toThrow(AbzugUebersteigtKautionError);
  });

  it('UC-04 VERLOREN → full einbehalt, Gegenstand AUSGEMUSTERT, no FREIGABE', () => {
    const { svc, db } = makeService();
    seedAll(db);

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'VERLOREN' });

    const gegenstand = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(gegenstand?.status).toBe('AUSGEMUSTERT');

    const abzuege = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'ABZUG'))).all();
    expect(abzuege).toHaveLength(1);
    expect(abzuege[0].betragEuro).toBe(100);

    const freigaben = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'FREIGABE'))).all();
    expect(freigaben).toHaveLength(0);
  });

  it('UC-04 IRREPARABEL no abzug → full FREIGABE, Gegenstand AUSGEMUSTERT', () => {
    const { svc, db } = makeService();
    seedAll(db);

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'IRREPARABEL' });

    const gegenstand = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(gegenstand?.status).toBe('AUSGEMUSTERT');

    const freigaben = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'FREIGABE'))).all();
    expect(freigaben).toHaveLength(1);
    expect(freigaben[0].betragEuro).toBe(100);
  });

  it('UC-04 IRREPARABEL with abzug → partial ABZUG + FREIGABE, Gegenstand AUSGEMUSTERT', () => {
    const { svc, db } = makeService();
    seedAll(db);

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'IRREPARABEL', abzug: 60 });

    const gegenstand = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(gegenstand?.status).toBe('AUSGEMUSTERT');

    const abzuege = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'ABZUG'))).all();
    expect(abzuege[0].betragEuro).toBe(60);

    const freigaben = db.select().from(schema.kautionsbewegung)
      .where(and(eq(schema.kautionsbewegung.ausleiheId, 'A-001'), eq(schema.kautionsbewegung.typ, 'FREIGABE'))).all();
    expect(freigaben[0].betragEuro).toBe(40);
  });

  it('unknown ausleiheId → throws AusleiheNichtGefundenError', () => {
    const { svc } = makeService();

    expect(() => svc.pruefenAbschliessen({ ausleiheId: 'NONEXISTENT', ergebnis: 'OK' }))
      .toThrow(AusleiheNichtGefundenError);
  });

  it('Gegenstand not IN_PRUEFUNG → throws GegenstandNichtInPruefungError', () => {
    const { svc, db } = makeService();
    seedKategorie(db);
    seedGegenstand(db, { status: 'VERFUEGBAR' });
    seedMitglied(db);
    seedAusleihe(db);
    seedKaution(db);

    expect(() => svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'OK' }))
      .toThrow(GegenstandNichtInPruefungError);
  });

  it('UC-04 OK: calls reservierungAnlegen — Gegenstand becomes RESERVIERT when Vormerkung exists', () => {
    const { svc, db } = makeService();
    seedAll(db);
    // Add a second member with a Vormerkung
    db.insert(schema.mitglied).values({ id: 'M-002', name: 'Bob' }).run();
    db.insert(schema.vormerkung).values({
      id: 'V-001',
      mitgliedId: 'M-002',
      kategorieId: 'kat-1',
      eingangszeit: new Date().toISOString(),
      status: 'WARTEND',
    }).run();

    svc.pruefenAbschliessen({ ausleiheId: 'A-001', ergebnis: 'OK' });

    const gegenstand = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(gegenstand?.status).toBe('RESERVIERT');
  });
});
