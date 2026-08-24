import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { KatalogService } from './katalog.service';
import { FixedDateSource } from '../common/fixed-date-source';
import {
  EingabeUngueltigError, DuplikatError, KategorieNichtGefundenError, MitgliedNichtGefundenError,
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
  return new KatalogService(makeDb() as any, new FixedDateSource(date));
}

describe('KatalogService', () => {
  // -- kategorieAnlegen --

  it('kategorieAnlegen: happy path returns KategorieDto with id', () => {
    const svc = makeService();
    const result = svc.kategorieAnlegen({ name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervall: 10, einweisungspflicht: false });
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Bohrmaschinen');
    expect(result.leihdauerTage).toBe(7);
    expect(result.wartungsintervall).toBe(10);
    expect(result.einweisungspflicht).toBe(false);
  });

  it('kategorieAnlegen: throws EingabeUngueltigError when name empty', () => {
    const svc = makeService();
    expect(() => svc.kategorieAnlegen({ name: '', leihdauerTage: 7, wartungsintervall: 10, einweisungspflicht: false }))
      .toThrow(EingabeUngueltigError);
  });

  it('kategorieAnlegen: throws EingabeUngueltigError when leihdauerTage=0', () => {
    const svc = makeService();
    expect(() => svc.kategorieAnlegen({ name: 'Test', leihdauerTage: 0, wartungsintervall: 10, einweisungspflicht: false }))
      .toThrow(EingabeUngueltigError);
  });

  it('kategorieAnlegen: throws DuplikatError when name already exists', () => {
    const svc = makeService();
    svc.kategorieAnlegen({ name: 'Sägen', leihdauerTage: 3, wartungsintervall: 5, einweisungspflicht: true });
    expect(() => svc.kategorieAnlegen({ name: 'Sägen', leihdauerTage: 3, wartungsintervall: 5, einweisungspflicht: true }))
      .toThrow(DuplikatError);
  });

  // -- kategorienAbfragen --

  it('kategorienAbfragen: returns empty array when no categories', () => {
    const svc = makeService();
    expect(svc.kategorienAbfragen()).toEqual([]);
  });

  it('kategorienAbfragen: returns all categories', () => {
    const svc = makeService();
    svc.kategorieAnlegen({ name: 'Kat1', leihdauerTage: 7, wartungsintervall: 5, einweisungspflicht: false });
    svc.kategorieAnlegen({ name: 'Kat2', leihdauerTage: 14, wartungsintervall: 10, einweisungspflicht: true });
    const result = svc.kategorienAbfragen();
    expect(result).toHaveLength(2);
    expect(result.map(k => k.name)).toContain('Kat1');
    expect(result.map(k => k.name)).toContain('Kat2');
  });

  // -- gegenstandAnlegen --

  it('gegenstandAnlegen: happy path, kaution=16 for wiederbeschaffungswert=80', () => {
    const svc = makeService();
    const kat = svc.kategorieAnlegen({ name: 'Drills', leihdauerTage: 7, wartungsintervall: 5, einweisungspflicht: false });
    const result = svc.gegenstandAnlegen({ inventarnummer: 'INV-001', kategorieId: kat.id, bezeichnung: 'Bohrmaschine', wiederbeschaffungswertEuro: 80 });
    expect(result.kaution).toBe(16);
    expect(result.inventarnummer).toBe('INV-001');
    expect(result.status).toBe('VERFUEGBAR');
  });

  it('gegenstandAnlegen: kaution min=5 for wiederbeschaffungswert=20', () => {
    const svc = makeService();
    const kat = svc.kategorieAnlegen({ name: 'Kleinkram', leihdauerTage: 3, wartungsintervall: 5, einweisungspflicht: false });
    const result = svc.gegenstandAnlegen({ inventarnummer: 'INV-002', kategorieId: kat.id, bezeichnung: 'Schraubenzieher', wiederbeschaffungswertEuro: 20 });
    expect(result.kaution).toBe(5); // 20*0.20=4, clamped to min 5
  });

  it('gegenstandAnlegen: kaution max=100 for wiederbeschaffungswert=600', () => {
    const svc = makeService();
    const kat = svc.kategorieAnlegen({ name: 'Teuer', leihdauerTage: 7, wartungsintervall: 5, einweisungspflicht: true });
    const result = svc.gegenstandAnlegen({ inventarnummer: 'INV-003', kategorieId: kat.id, bezeichnung: 'Laser', wiederbeschaffungswertEuro: 600 });
    expect(result.kaution).toBe(100); // 600*0.20=120, clamped to max 100
  });

  it('gegenstandAnlegen: throws KategorieNichtGefundenError for unknown category', () => {
    const svc = makeService();
    expect(() => svc.gegenstandAnlegen({ inventarnummer: 'INV-004', kategorieId: 'unknown-uuid', bezeichnung: 'Test', wiederbeschaffungswertEuro: 100 }))
      .toThrow(KategorieNichtGefundenError);
  });

  it('gegenstandAnlegen: throws DuplikatError for duplicate inventarnummer', () => {
    const svc = makeService();
    const kat = svc.kategorieAnlegen({ name: 'Werkzeug', leihdauerTage: 7, wartungsintervall: 5, einweisungspflicht: false });
    svc.gegenstandAnlegen({ inventarnummer: 'INV-DUP', kategorieId: kat.id, bezeichnung: 'Hammer', wiederbeschaffungswertEuro: 30 });
    expect(() => svc.gegenstandAnlegen({ inventarnummer: 'INV-DUP', kategorieId: kat.id, bezeichnung: 'Hammer2', wiederbeschaffungswertEuro: 30 }))
      .toThrow(DuplikatError);
  });

  // -- mitgliedAnlegen --

  it('mitgliedAnlegen: happy path', () => {
    const svc = makeService();
    const result = svc.mitgliedAnlegen({ name: 'Max Mustermann' });
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Max Mustermann');
  });

  it('mitgliedAnlegen: throws EingabeUngueltigError for blank name', () => {
    const svc = makeService();
    expect(() => svc.mitgliedAnlegen({ name: '   ' })).toThrow(EingabeUngueltigError);
  });

  // -- mitgliedAbfragen --

  it('mitgliedAbfragen: gesperrt=false when no overdue loans', () => {
    const svc = makeService();
    const m = svc.mitgliedAnlegen({ name: 'Anna' });
    const result = svc.mitgliedAbfragen(m.id);
    expect(result.gesperrt).toBe(false);
  });

  it('mitgliedAbfragen: gesperrt=true when overdue loan exists (gegenstand not IN_PRUEFUNG)', () => {
    const db = makeDb();
    const svc = new KatalogService(db as any, new FixedDateSource(new Date('2024-01-15')));
    const m = svc.mitgliedAnlegen({ name: 'Schorsch' });
    const kat = svc.kategorieAnlegen({ name: 'Geraete', leihdauerTage: 7, wartungsintervall: 5, einweisungspflicht: false });
    svc.gegenstandAnlegen({ inventarnummer: 'INV-LATE', kategorieId: kat.id, bezeichnung: 'Gerät', wiederbeschaffungswertEuro: 100 });

    // Insert overdue ausleihe directly
    db.insert(schema.ausleihe).values({
      id: 'ausleihe-1',
      gegenstandId: 'INV-LATE',
      mitgliedId: m.id,
      ausgabeDatum: '2024-01-01',
      rueckgabeFrist: '2024-01-10', // before today 2024-01-15
      verlaengert: false,
      status: 'OFFEN',
    }).run();

    expect(svc.mitgliedAbfragen(m.id).gesperrt).toBe(true);
  });

  it('mitgliedAbfragen: gesperrt=false when overdue loan but gegenstand IS IN_PRUEFUNG', () => {
    const db = makeDb();
    const svc = new KatalogService(db as any, new FixedDateSource(new Date('2024-01-15')));
    const m = svc.mitgliedAnlegen({ name: 'Berta' });
    const kat = svc.kategorieAnlegen({ name: 'Geraete2', leihdauerTage: 7, wartungsintervall: 5, einweisungspflicht: false });
    svc.gegenstandAnlegen({ inventarnummer: 'INV-PRUEF', kategorieId: kat.id, bezeichnung: 'Gerät', wiederbeschaffungswertEuro: 100 });

    // Set gegenstand to IN_PRUEFUNG via raw SQL
    (db as any).session.client.prepare("UPDATE gegenstand SET status = 'IN_PRUEFUNG' WHERE inventarnummer = 'INV-PRUEF'").run();

    db.insert(schema.ausleihe).values({
      id: 'ausleihe-2',
      gegenstandId: 'INV-PRUEF',
      mitgliedId: m.id,
      ausgabeDatum: '2024-01-01',
      rueckgabeFrist: '2024-01-10',
      verlaengert: false,
      status: 'OFFEN',
    }).run();

    expect(svc.mitgliedAbfragen(m.id).gesperrt).toBe(false);
  });

  it('mitgliedAbfragen: throws MitgliedNichtGefundenError for unknown id', () => {
    const svc = makeService();
    expect(() => svc.mitgliedAbfragen('no-such-id')).toThrow(MitgliedNichtGefundenError);
  });
});
