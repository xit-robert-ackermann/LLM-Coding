import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { WartungService } from './wartung.service';
import { VormerkungService } from '../vormerkung/vormerkung.service';
import { FixedDateSource } from '../common/fixed-date-source';
import {
  GegenstandNichtGefundenError,
  GegenstandNichtWartungsfaelligError,
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

function makeService(date = new Date('2024-06-01')) {
  const db = makeDb() as any;
  const dateSource = new FixedDateSource(date);
  const vormerkungService = new VormerkungService(db, dateSource);
  return { svc: new WartungService(db, vormerkungService), db };
}

function seedKategorie(db: any) {
  db.insert(schema.kategorie).values({
    id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: false,
  }).run();
}

function seedGegenstand(db: any, status = 'WARTUNGSFAELLIG', zaehler = 5) {
  db.insert(schema.gegenstand).values({
    inventarnummer: 'G-001', kategorieId: 'kat-1', wiederbeschaffungswertEuro: 200,
    nutzungszaehler: zaehler, status,
  }).run();
}

describe('WartungService', () => {
  it('UC-05: WARTUNGSFAELLIG → VERFUEGBAR, nutzungszaehler reset to 0, zustandswechsel written', () => {
    const { svc, db } = makeService();
    seedKategorie(db);
    seedGegenstand(db, 'WARTUNGSFAELLIG', 5);

    svc.wartungAbschliessen('G-001');

    const g = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(g?.status).toBe('VERFUEGBAR');
    expect(g?.nutzungszaehler).toBe(0);

    const wechsel = db.select().from(schema.zustandswechsel).all();
    expect(wechsel).toHaveLength(1);
    expect(wechsel[0].vonStatus).toBe('WARTUNGSFAELLIG');
    expect(wechsel[0].nachStatus).toBe('VERFUEGBAR');
    expect(wechsel[0].grund).toBe('wartung');
  });

  it('UC-05: Gegenstand not WARTUNGSFAELLIG → throws GegenstandNichtWartungsfaelligError', () => {
    const { svc, db } = makeService();
    seedKategorie(db);
    seedGegenstand(db, 'VERFUEGBAR', 0);

    expect(() => svc.wartungAbschliessen('G-001'))
      .toThrow(GegenstandNichtWartungsfaelligError);
  });

  it('UC-05: unknown inventarnummer → throws GegenstandNichtGefundenError', () => {
    const { svc } = makeService();

    expect(() => svc.wartungAbschliessen('NONEXISTENT'))
      .toThrow(GegenstandNichtGefundenError);
  });

  it('UC-05: with Vormerkung → Gegenstand becomes RESERVIERT (reservierungAnlegen called)', () => {
    const { svc, db } = makeService();
    seedKategorie(db);
    seedGegenstand(db, 'WARTUNGSFAELLIG', 5);
    db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
    db.insert(schema.vormerkung).values({
      id: 'V-001', mitgliedId: 'M-001', kategorieId: 'kat-1',
      eingangszeit: new Date().toISOString(), status: 'WARTEND',
    }).run();

    svc.wartungAbschliessen('G-001');

    const g = db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, 'G-001')).get();
    expect(g?.status).toBe('RESERVIERT');
  });
});
