import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { AuditService } from './audit.service';

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

function makeService(db: ReturnType<typeof makeDb>) {
  return new AuditService(db as any);
}

describe('AuditService', () => {
  let db: ReturnType<typeof makeDb>;
  let service: AuditService;

  beforeEach(() => {
    db = makeDb();
    service = makeService(db);
  });

  it('returns empty array when no entries', () => {
    expect(service.auditAbfragen()).toEqual([]);
  });

  it('returns kautionsbewegungen', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'm1', name: 'Max' }).run();
    db.insert(schema.ausleihe).values({ id: 'a1', gegenstandId: 'G1', mitgliedId: 'm1', ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-08', verlaengert: false, status: 'OFFEN' }).run();
    db.insert(schema.kautionsbewegung).values({ id: 'kb1', ausleiheId: 'a1', typ: 'HINTERLEGUNG', betragEuro: 20, zeitstempel: '2024-01-01T10:00:00Z', ausloeserId: 'm1' }).run();

    const result = service.auditAbfragen();
    expect(result).toHaveLength(1);
    expect(result[0].typ).toBe('kautionsbewegung');
    expect(result[0].bewegungstyp).toBe('HINTERLEGUNG');
    expect(result[0].betragEuro).toBe(20);
  });

  it('returns zustandswechsel entries', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z1', gegenstandId: 'G1', vonStatus: 'VERFUEGBAR', nachStatus: 'IN_PRUEFUNG', grund: 'Rückgabe', zeitstempel: '2024-01-08T15:00:00Z' }).run();

    const result = service.auditAbfragen();
    expect(result).toHaveLength(1);
    expect(result[0].typ).toBe('zustandswechsel');
    expect(result[0].vonStatus).toBe('VERFUEGBAR');
    expect(result[0].nachStatus).toBe('IN_PRUEFUNG');
  });

  it('filters by gegenstandId', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G2', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z1', gegenstandId: 'G1', vonStatus: 'VERFUEGBAR', nachStatus: 'IN_PRUEFUNG', grund: 'Test', zeitstempel: '2024-01-08T15:00:00Z' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z2', gegenstandId: 'G2', vonStatus: 'VERFUEGBAR', nachStatus: 'IN_PRUEFUNG', grund: 'Test', zeitstempel: '2024-01-09T15:00:00Z' }).run();

    const result = service.auditAbfragen({ gegenstandId: 'G1' });
    expect(result).toHaveLength(1);
    expect(result[0].gegenstandId).toBe('G1');
  });

  it('filters by von/bis date range', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z1', gegenstandId: 'G1', vonStatus: 'VERFUEGBAR', nachStatus: 'IN_PRUEFUNG', grund: 'A', zeitstempel: '2024-01-05T10:00:00Z' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z2', gegenstandId: 'G1', vonStatus: 'IN_PRUEFUNG', nachStatus: 'VERFUEGBAR', grund: 'B', zeitstempel: '2024-01-10T10:00:00Z' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z3', gegenstandId: 'G1', vonStatus: 'VERFUEGBAR', nachStatus: 'GESPERRT', grund: 'C', zeitstempel: '2024-01-15T10:00:00Z' }).run();

    const result = service.auditAbfragen({ von: '2024-01-06', bis: '2024-01-12' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('z2');
  });

  it('returns entries sorted by zeitstempel', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z2', gegenstandId: 'G1', vonStatus: 'VERFUEGBAR', nachStatus: 'IN_PRUEFUNG', grund: 'B', zeitstempel: '2024-01-10T10:00:00Z' }).run();
    db.insert(schema.zustandswechsel).values({ id: 'z1', gegenstandId: 'G1', vonStatus: 'IN_PRUEFUNG', nachStatus: 'VERFUEGBAR', grund: 'A', zeitstempel: '2024-01-05T10:00:00Z' }).run();

    const result = service.auditAbfragen();
    expect(result[0].zeitstempel < result[1].zeitstempel).toBe(true);
  });
});
