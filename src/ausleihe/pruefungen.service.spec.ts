import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { AusleiheService } from '../ausleihe/ausleihe.service';
import { FixedDateSource } from '../common/fixed-date-source';

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

describe('AusleiheService.pruefungsarbeitsliste', () => {
  let db: ReturnType<typeof makeDb>;
  let service: AusleiheService;

  beforeEach(() => {
    db = makeDb();
    const dateSource = new FixedDateSource(new Date('2024-01-10'));
    service = new AusleiheService(db as any, dateSource);
  });

  it('returns empty list when no IN_PRUEFUNG items', () => {
    expect(service.pruefungsarbeitsliste()).toEqual([]);
  });

  it('returns Ausleihen where Gegenstand is IN_PRUEFUNG', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'IN_PRUEFUNG' }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G2', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'VERFUEGBAR' }).run();
    db.insert(schema.mitglied).values({ id: 'm1', name: 'Max' }).run();
    db.insert(schema.ausleihe).values({ id: 'a1', gegenstandId: 'G1', mitgliedId: 'm1', ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-08', verlaengert: false, status: 'OFFEN' }).run();
    db.insert(schema.ausleihe).values({ id: 'a2', gegenstandId: 'G2', mitgliedId: 'm1', ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-08', verlaengert: false, status: 'OFFEN' }).run();

    const result = service.pruefungsarbeitsliste();
    expect(result).toHaveLength(1);
    expect(result[0].gegenstandId).toBe('G1');
  });

  it('excludes closed Ausleihen', () => {
    db.insert(schema.kategorie).values({ id: 'k1', name: 'Kat', leihdauerTage: 7, wartungsintervallAusleihen: 5, einweisungspflichtig: false }).run();
    db.insert(schema.gegenstand).values({ inventarnummer: 'G1', kategorieId: 'k1', wiederbeschaffungswertEuro: 100, nutzungszaehler: 0, status: 'IN_PRUEFUNG' }).run();
    db.insert(schema.mitglied).values({ id: 'm1', name: 'Max' }).run();
    db.insert(schema.ausleihe).values({ id: 'a1', gegenstandId: 'G1', mitgliedId: 'm1', ausgabeDatum: '2024-01-01', rueckgabeFrist: '2024-01-08', verlaengert: false, status: 'ABGESCHLOSSEN' }).run();

    expect(service.pruefungsarbeitsliste()).toEqual([]);
  });
});
