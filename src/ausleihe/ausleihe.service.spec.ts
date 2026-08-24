import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { AusleiheService } from './ausleihe.service';
import { FixedDateSource } from '../common/fixed-date-source';
import {
  MitgliedNichtGefundenError, GegenstandNichtGefundenError, AusleiheNichtGefundenError,
  MitgliedGesperrtError, MaxAusleihenErreichtError, GegenstandNichtVerfuegbarError,
  EinweisungFehltError, BereitsVerlaengertError, AusleiheUeberfaelligError,
  VormerkungVorhandenError, AusleiheNichtOffenError,
} from '../errors/domain-errors';

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
  `);
  return drizzle(sqlite, { schema });
}

function makeService(date = new Date('2024-01-15')) {
  return new AusleiheService(makeDb() as any, new FixedDateSource(date));
}

// --- Seed helpers ---

function seedBase(db: ReturnType<typeof makeDb>) {
  db.insert(schema.kategorie).values({
    id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7,
    wartungsintervallAusleihen: 10, einweisungspflichtig: false,
  }).run();
  db.insert(schema.gegenstand).values({
    inventarnummer: 'G-001', kategorieId: 'kat-1',
    wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR',
  }).run();
  db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
}

// --- ausgeben ---

describe('AusleiheService.ausgeben', () => {
  it('UC-01: happy path creates Ausleihe, sets Gegenstand to AUSGELIEHEN, writes HINTERLEGUNG', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);

    const result = svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' });

    expect(result.id).toBeDefined();
    expect(result.gegenstandId).toBe('G-001');
    expect(result.mitgliedId).toBe('M-001');
    expect(result.status).toBe('OFFEN');
    expect(result.verlaengert).toBe(false);
    expect(result.kautionEuro).toBeDefined();

    const g = db.select().from(schema.gegenstand)
      .where(require('drizzle-orm').eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(g.status).toBe('AUSGELIEHEN');

    const k = db.select().from(schema.kautionsbewegung).all();
    expect(k.length).toBe(1);
    expect(k[0].typ).toBe('HINTERLEGUNG');
    expect(k[0].ausleiheId).toBe(result.id);
  });

  it('UC-01: throws MitgliedNichtGefundenError for unknown mitglied', () => {
    const svc = makeService();
    expect(() => svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'GHOST' }))
      .toThrow(MitgliedNichtGefundenError);
  });

  it('UC-01: throws MitgliedGesperrtError when member has overdue open loan (Gegenstand NOT IN_PRUEFUNG)', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-02-01')));
    seedBase(db);
    db.insert(schema.gegenstand).values({
      inventarnummer: 'G-002', kategorieId: 'kat-1',
      wiederbeschaffungswertEuro: 50, nutzungszaehler: 0, status: 'AUSGELIEHEN',
    }).run();
    db.insert(schema.ausleihe).values({
      id: 'A-OLD', gegenstandId: 'G-002', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-10',
      verlaengert: false, status: 'OFFEN',
    }).run();

    expect(() => svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' }))
      .toThrow(MitgliedGesperrtError);
  });

  it('UC-01: member NOT gesperrt when overdue loan Gegenstand IS IN_PRUEFUNG', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-02-01')));
    seedBase(db);
    db.insert(schema.gegenstand).values({
      inventarnummer: 'G-002', kategorieId: 'kat-1',
      wiederbeschaffungswertEuro: 50, nutzungszaehler: 0, status: 'IN_PRUEFUNG',
    }).run();
    db.insert(schema.ausleihe).values({
      id: 'A-OLD', gegenstandId: 'G-002', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-10',
      verlaengert: false, status: 'OFFEN',
    }).run();

    const result = svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' });
    expect(result.status).toBe('OFFEN');
  });

  it('UC-01: throws MaxAusleihenErreichtError when member already has 3 open Ausleihen', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    for (let i = 2; i <= 4; i++) {
      db.insert(schema.gegenstand).values({
        inventarnummer: `G-00${i}`, kategorieId: 'kat-1',
        wiederbeschaffungswertEuro: 50, nutzungszaehler: 0, status: 'AUSGELIEHEN',
      }).run();
      db.insert(schema.ausleihe).values({
        id: `A-00${i}`, gegenstandId: `G-00${i}`, mitgliedId: 'M-001',
        ausgabeDatum: '2024-01-10', rueckgabeFrist: '2024-01-20',
        verlaengert: false, status: 'OFFEN',
      }).run();
    }

    expect(() => svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' }))
      .toThrow(MaxAusleihenErreichtError);
  });

  it('UC-01: throws GegenstandNichtVerfuegbarError when Gegenstand is AUSGELIEHEN', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'AUSGELIEHEN' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();

    expect(() => svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' }))
      .toThrow(GegenstandNichtVerfuegbarError);
  });

  it('UC-01: succeeds when Gegenstand is RESERVIERT for THIS member (marks reservation ABGEHOLT)', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'RESERVIERT' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-10', verfaelltAm: '2024-01-20', status: 'AKTIV',
    }).run();

    const result = svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' });
    expect(result.status).toBe('OFFEN');

    const { eq } = require('drizzle-orm');
    const res = db.select().from(schema.reservierung).where(eq(schema.reservierung.id, 'R-001')).get();
    expect(res.status).toBe('ABGEHOLT');
  });

  it('UC-01: throws GegenstandNichtVerfuegbarError when RESERVIERT for OTHER member', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'RESERVIERT' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.mitglied).values({ id: 'M-002', name: 'Bob' }).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-002',
      entstandenAm: '2024-01-10', verfaelltAm: '2024-01-20', status: 'AKTIV',
    }).run();

    expect(() => svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' }))
      .toThrow(GegenstandNichtVerfuegbarError);
  });

  it('UC-01: throws EinweisungFehltError when einweisungspflichtig and no Einweisung', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Schweißgeräte', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: true }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 200, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();

    expect(() => svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' }))
      .toThrow(EinweisungFehltError);
  });

  it('UC-01: succeeds when einweisungspflichtig and Einweisung exists', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Schweißgeräte', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: true }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 200, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.einweisung).values({ id: 'E-001', mitgliedId: 'M-001', kategorieId: 'kat-1', dokumentiertAm: '2024-01-01' }).run();

    const result = svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' });
    expect(result.status).toBe('OFFEN');
  });

  it('UC-01: Kaution formula: wiederbeschaffungswert=80 → kaution=16', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 80, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();

    const result = svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' });
    expect(result.kautionEuro).toBe(16);
  });

  it('UC-01: Rückgabefrist = today + leihdauerTage', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();

    const result = svc.ausgeben({ gegenstandId: 'G-001', mitgliedId: 'M-001' });
    expect(result.ausgabeDatum).toBe('2024-01-15');
    expect(result.rueckgabeFrist).toBe('2024-01-22');
  });
});

// --- verlaengern ---

describe('AusleiheService.verlaengern', () => {
  function seedWithAusleihe(db: ReturnType<typeof makeDb>, overrides: Partial<typeof schema.ausleihe.$inferInsert> = {}) {
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'AUSGELIEHEN' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.ausleihe).values({
      id: 'A-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-15', rueckgabeFrist: '2024-01-22',
      verlaengert: false, status: 'OFFEN',
      ...overrides,
    }).run();
  }

  it('UC-02: happy path sets verlaengert=true, neue Frist = alte Frist + leihdauer', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    seedWithAusleihe(db);

    const result = svc.verlaengern('A-001');
    expect(result.verlaengert).toBe(true);
    expect(result.rueckgabeFrist).toBe('2024-01-29');
  });

  it('UC-02: throws AusleiheNichtGefundenError for unknown id', () => {
    const svc = makeService();
    expect(() => svc.verlaengern('GHOST')).toThrow(AusleiheNichtGefundenError);
  });

  it('UC-02: throws BereitsVerlaengertError when already extended', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    seedWithAusleihe(db, { verlaengert: true });

    expect(() => svc.verlaengern('A-001')).toThrow(BereitsVerlaengertError);
  });

  it('UC-02: throws AusleiheUeberfaelligError when overdue', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-25')));
    seedWithAusleihe(db);

    expect(() => svc.verlaengern('A-001')).toThrow(AusleiheUeberfaelligError);
  });

  it('UC-02: throws VormerkungVorhandenError when open Vormerkung exists for Kategorie', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    seedWithAusleihe(db);
    db.insert(schema.mitglied).values({ id: 'M-002', name: 'Bob' }).run();
    db.insert(schema.vormerkung).values({
      id: 'V-001', mitgliedId: 'M-002', kategorieId: 'kat-1',
      eingangszeit: '2024-01-18', status: 'WARTEND',
    }).run();

    expect(() => svc.verlaengern('A-001')).toThrow(VormerkungVorhandenError);
  });
});

// --- rueckgabeEntgegennehmen ---

describe('AusleiheService.rueckgabeEntgegennehmen', () => {
  function seedWithAusleihe(db: ReturnType<typeof makeDb>, statusOverride?: string) {
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: statusOverride ?? 'AUSGELIEHEN' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.ausleihe).values({
      id: 'A-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-15', rueckgabeFrist: '2024-01-22',
      verlaengert: false, status: 'OFFEN',
    }).run();
  }

  it('UC-03: happy path: Gegenstand → IN_PRUEFUNG, Ausleihe stays OFFEN', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    seedWithAusleihe(db);

    const result = svc.rueckgabeEntgegennehmen('A-001');
    expect(result.status).toBe('OFFEN');

    const { eq } = require('drizzle-orm');
    const g = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(g.status).toBe('IN_PRUEFUNG');
  });

  it('UC-03: saves Auffaelligkeiten', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    seedWithAusleihe(db);

    const result = svc.rueckgabeEntgegennehmen('A-001', 'Kratzer am Gehäuse');
    expect(result.auffaelligkeiten).toBe('Kratzer am Gehäuse');
  });

  it('UC-03: throws AusleiheNichtGefundenError for unknown id', () => {
    const svc = makeService();
    expect(() => svc.rueckgabeEntgegennehmen('GHOST')).toThrow(AusleiheNichtGefundenError);
  });

  it('UC-03: throws AusleiheNichtOffenError for ABGESCHLOSSEN Ausleihe', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    db.insert(schema.kategorie).values({ id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.ausleihe).values({
      id: 'A-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-10', rueckgabeFrist: '2024-01-17',
      verlaengert: false, status: 'ABGESCHLOSSEN',
    }).run();

    expect(() => svc.rueckgabeEntgegennehmen('A-001')).toThrow(AusleiheNichtOffenError);
  });

  it('UC-03: throws AusleiheNichtOffenError when Gegenstand not AUSGELIEHEN', () => {
    const db = makeDb() as any;
    const svc = new AusleiheService(db, new FixedDateSource(new Date('2024-01-20')));
    seedWithAusleihe(db, 'VERFUEGBAR');

    expect(() => svc.rueckgabeEntgegennehmen('A-001')).toThrow(AusleiheNichtOffenError);
  });
});
