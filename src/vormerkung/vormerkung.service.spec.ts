import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { VormerkungService } from './vormerkung.service';
import { FixedDateSource } from '../common/fixed-date-source';
import {
  KategorieNichtGefundenError,
  BereitsVorgemerktError,
  VormerkungNichtGefundenError,
  ReservierungNichtGefundenError,
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
    CREATE TABLE zustandswechsel (id TEXT PRIMARY KEY, gegenstand_id TEXT NOT NULL, von_status TEXT NOT NULL, nach_status TEXT NOT NULL, grund TEXT NOT NULL, zeitstempel TEXT NOT NULL);
  `);
  return drizzle(sqlite, { schema });
}

function makeService(date = new Date('2024-01-15')) {
  return new VormerkungService(makeDb() as any, new FixedDateSource(date));
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
  db.insert(schema.mitglied).values({ id: 'M-002', name: 'Bob' }).run();
  db.insert(schema.mitglied).values({ id: 'M-003', name: 'Charlie' }).run();
}

// --- vormerken ---

describe('VormerkungService.vormerken', () => {
  it('UC-07: happy path creates Vormerkung with status WARTEND', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);

    const result = svc.vormerken({ mitgliedId: 'M-001', kategorieId: 'kat-1' });

    expect(result.id).toBeDefined();
    expect(result.mitgliedId).toBe('M-001');
    expect(result.kategorieId).toBe('kat-1');
    expect(result.status).toBe('WARTEND');
    expect(result.eingangszeit).toBeDefined();
  });

  it('throws KategorieNichtGefundenError for unknown kategorie', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();

    expect(() => svc.vormerken({ mitgliedId: 'M-001', kategorieId: 'unbekannt' }))
      .toThrow(KategorieNichtGefundenError);
  });

  it('throws BereitsVorgemerktError for duplicate', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    svc.vormerken({ mitgliedId: 'M-001', kategorieId: 'kat-1' });

    expect(() => svc.vormerken({ mitgliedId: 'M-001', kategorieId: 'kat-1' }))
      .toThrow(BereitsVorgemerktError);
  });

  it('BR-033: gesperrtes Mitglied can still vormerken', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    // Create overdue ausleihe for M-001 (gesperrt)
    db.insert(schema.ausleihe).values({
      id: 'A-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-08',
      verlaengert: false, status: 'OFFEN',
    }).run();
    db.update(schema.gegenstand).set({ status: 'AUSGELIEHEN' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();

    // Gesperrtes Mitglied should still be allowed to vormerken
    const result = svc.vormerken({ mitgliedId: 'M-001', kategorieId: 'kat-1' });
    expect(result.status).toBe('WARTEND');
  });
});

// --- reservierungAnlegen ---

describe('VormerkungService.reservierungAnlegen', () => {
  it('UC-09: creates Reservierung for first WARTEND Mitglied, sets Gegenstand RESERVIERT', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T10:00:00.000Z', status: 'WARTEND',
    }).run();

    svc.reservierungAnlegen('G-001');

    const g = db.select().from(schema.gegenstand)
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).get();
    expect(g?.status).toBe('RESERVIERT');

    const res = db.select().from(schema.reservierung).all();
    expect(res).toHaveLength(1);
    expect(res[0].mitgliedId).toBe('M-001');
    expect(res[0].gegenstandId).toBe('G-001');
    expect(res[0].status).toBe('AKTIV');
    expect(res[0].verfaelltAm).toBe('2024-01-18'); // today + 3
  });

  it('BR-033: skips gesperrtes Mitglied, gives reservation to next', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.insert(schema.gegenstand).values({
      inventarnummer: 'G-002', kategorieId: 'kat-1',
      wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'AUSGELIEHEN',
    }).run();
    // M-001 gesperrt (overdue ausleihe on G-002)
    db.insert(schema.ausleihe).values({
      id: 'A-001', gegenstandId: 'G-002', mitgliedId: 'M-001',
      ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-08',
      verlaengert: false, status: 'OFFEN',
    }).run();
    // M-001 first in queue, M-002 second
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T08:00:00.000Z', status: 'WARTEND',
    }).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-002', mitgliedId: 'M-002', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T09:00:00.000Z', status: 'WARTEND',
    }).run();

    svc.reservierungAnlegen('G-001');

    const res = db.select().from(schema.reservierung).all();
    expect(res).toHaveLength(1);
    expect(res[0].mitgliedId).toBe('M-002'); // skipped M-001
  });

  it('does nothing if queue is empty', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);

    svc.reservierungAnlegen('G-001');

    const res = db.select().from(schema.reservierung).all();
    expect(res).toHaveLength(0);
    const g = db.select().from(schema.gegenstand).all();
    expect(g[0].status).toBe('VERFUEGBAR');
  });

  it('BR-032: does nothing if Gegenstand is WARTUNGSFAELLIG', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'WARTUNGSFAELLIG' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T10:00:00.000Z', status: 'WARTEND',
    }).run();

    svc.reservierungAnlegen('G-001');

    const res = db.select().from(schema.reservierung).all();
    expect(res).toHaveLength(0);
  });
});

// --- verfalleneReservierungenBereinigen ---

describe('VormerkungService.verfalleneReservierungenBereinigen', () => {
  it('marks Reservierung as VERFALLEN if older than 3 days', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'RESERVIERT' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-10', verfaelltAm: '2024-01-13', // 2 days before today
      status: 'AKTIV',
    }).run();

    svc.verfalleneReservierungenBereinigen();

    const res = db.select().from(schema.reservierung).all();
    expect(res[0].status).toBe('VERFALLEN');
    const g = db.select().from(schema.gegenstand).all();
    expect(g[0].status).toBe('VERFUEGBAR');
  });

  it('cascades: next Mitglied in queue gets new Reservierung after old one expires', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'RESERVIERT' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    // Expired reservation for M-001
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-10', verfaelltAm: '2024-01-13',
      status: 'AKTIV',
    }).run();
    // M-001's Vormerkung (already served, not WARTEND — the expired res was for them)
    // M-002 is in queue waiting
    db.insert(schema.vormerkung).values({
      id: 'VM-002', mitgliedId: 'M-002', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T09:00:00.000Z', status: 'WARTEND',
    }).run();

    svc.verfalleneReservierungenBereinigen();

    const allRes = db.select().from(schema.reservierung).all();
    expect(allRes).toHaveLength(2);
    const newRes = allRes.find((r: any) => r.id !== 'R-001');
    expect(newRes.mitgliedId).toBe('M-002');
    expect(newRes.status).toBe('AKTIV');
    const g = db.select().from(schema.gegenstand).all();
    expect(g[0].status).toBe('RESERVIERT');
  });

  it('does not affect fresh Reservierungen (less than 3 days old)', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'RESERVIERT' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-14', verfaelltAm: '2024-01-17', // still valid
      status: 'AKTIV',
    }).run();

    svc.verfalleneReservierungenBereinigen();

    const res = db.select().from(schema.reservierung).all();
    expect(res[0].status).toBe('AKTIV');
    const g = db.select().from(schema.gegenstand).all();
    expect(g[0].status).toBe('RESERVIERT');
  });
});

// --- stornieren ---

describe('VormerkungService.stornieren', () => {
  it('removes Vormerkung without active reservation → sets STORNIERT', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T10:00:00.000Z', status: 'WARTEND',
    }).run();

    svc.stornieren('VM-001');

    const vm = db.select().from(schema.vormerkung).all();
    expect(vm[0].status).toBe('STORNIERT');
  });

  it('with active reservation → cancels reservation and cascades to next in queue', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'RESERVIERT' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T08:00:00.000Z', status: 'WARTEND',
    }).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-002', mitgliedId: 'M-002', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T09:00:00.000Z', status: 'WARTEND',
    }).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-15', verfaelltAm: '2024-01-18',
      status: 'AKTIV',
    }).run();

    svc.stornieren('VM-001');

    const allRes = db.select().from(schema.reservierung).all();
    const oldRes = allRes.find((r: any) => r.id === 'R-001');
    expect(oldRes.status).toBe('VERFALLEN');
    const newRes = allRes.find((r: any) => r.id !== 'R-001');
    expect(newRes?.mitgliedId).toBe('M-002');
    expect(newRes?.status).toBe('AKTIV');
  });

  it('with active reservation, no next → Gegenstand becomes VERFUEGBAR', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'RESERVIERT' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T08:00:00.000Z', status: 'WARTEND',
    }).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-15', verfaelltAm: '2024-01-18',
      status: 'AKTIV',
    }).run();

    svc.stornieren('VM-001');

    const g = db.select().from(schema.gegenstand).all();
    expect(g[0].status).toBe('VERFUEGBAR');
  });

  it('throws VormerkungNichtGefundenError for unknown id', () => {
    const svc = makeService();
    expect(() => svc.stornieren('unbekannt')).toThrow(VormerkungNichtGefundenError);
  });

  it('with active reservations for two kategorien → cancels only the matching one (bug-fix Kategoriefilter)', () => {
    // Regression test: stornieren must not cancel a reservation for a different kategorie
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db); // provides kat-1, G-001, M-001, M-002, M-003

    // Add a second kategorie + gegenstand
    db.insert(schema.kategorie).values({
      id: 'kat-2', name: 'Sägen', leihdauerTage: 7,
      wartungsintervallAusleihen: 10, einweisungspflichtig: false,
    }).run();
    db.insert(schema.gegenstand).values({
      inventarnummer: 'G-002', kategorieId: 'kat-2',
      wiederbeschaffungswertEuro: 200, nutzungszaehler: 0, status: 'RESERVIERT',
    }).run();

    // M-001 has a WARTEND Vormerkung for kat-1 (will be storniert) …
    db.insert(schema.vormerkung).values({
      id: 'VM-kat1', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T08:00:00.000Z', status: 'WARTEND',
    }).run();
    // … and a separate AKTIV Reservierung for kat-2
    db.insert(schema.reservierung).values({
      id: 'R-kat2', gegenstandId: 'G-002', mitgliedId: 'M-001',
      entstandenAm: '2024-01-15', verfaelltAm: '2024-01-18',
      status: 'AKTIV',
    }).run();

    svc.stornieren('VM-kat1');

    const allRes = db.select().from(schema.reservierung).all();
    const rKat2 = allRes.find((r: any) => r.id === 'R-kat2');
    // The kat-2 reservation must remain untouched
    expect(rKat2?.status).toBe('AKTIV');
  });
});

// --- reservierungStornieren ---

describe('VormerkungService.reservierungStornieren', () => {
  it('sets Reservierung VERFALLEN, Gegenstand VERFUEGBAR, cascades', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.update(schema.gegenstand).set({ status: 'RESERVIERT' })
      .where(schema.gegenstand.inventarnummer === 'G-001' as any).run();
    db.insert(schema.reservierung).values({
      id: 'R-001', gegenstandId: 'G-001', mitgliedId: 'M-001',
      entstandenAm: '2024-01-15', verfaelltAm: '2024-01-18',
      status: 'AKTIV',
    }).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-002', mitgliedId: 'M-002', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T09:00:00.000Z', status: 'WARTEND',
    }).run();

    svc.reservierungStornieren('R-001');

    const res = db.select().from(schema.reservierung).all();
    const oldRes = res.find((r: any) => r.id === 'R-001');
    expect(oldRes.status).toBe('VERFALLEN');
    const newRes = res.find((r: any) => r.id !== 'R-001');
    expect(newRes?.mitgliedId).toBe('M-002');
    expect(newRes?.status).toBe('AKTIV');
  });

  it('throws ReservierungNichtGefundenError for unknown id', () => {
    const svc = makeService();
    expect(() => svc.reservierungStornieren('unbekannt')).toThrow(ReservierungNichtGefundenError);
  });
});

// --- vormerkungenAbfragen ---

describe('VormerkungService.vormerkungenAbfragen', () => {
  it('returns all Vormerkungen filtered by kategorieId and mitgliedId', () => {
    const db = makeDb() as any;
    const svc = new VormerkungService(db, new FixedDateSource(new Date('2024-01-15')));
    seedBase(db);
    db.insert(schema.kategorie).values({
      id: 'kat-2', name: 'Sägen', leihdauerTage: 7,
      wartungsintervallAusleihen: 10, einweisungspflichtig: false,
    }).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T08:00:00.000Z', status: 'WARTEND',
    }).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-002', mitgliedId: 'M-002', kategorieId: 'kat-1',
      eingangszeit: '2024-01-10T09:00:00.000Z', status: 'WARTEND',
    }).run();
    db.insert(schema.vormerkung).values({
      id: 'VM-003', mitgliedId: 'M-001', kategorieId: 'kat-2',
      eingangszeit: '2024-01-10T10:00:00.000Z', status: 'WARTEND',
    }).run();

    const all = svc.vormerkungenAbfragen();
    expect(all).toHaveLength(3);

    const byKategorie = svc.vormerkungenAbfragen({ kategorieId: 'kat-1' });
    expect(byKategorie).toHaveLength(2);

    const byMitglied = svc.vormerkungenAbfragen({ mitgliedId: 'M-001' });
    expect(byMitglied).toHaveLength(2);

    const byBoth = svc.vormerkungenAbfragen({ kategorieId: 'kat-1', mitgliedId: 'M-001' });
    expect(byBoth).toHaveLength(1);
    expect(byBoth[0].id).toBe('VM-001');
  });
});
