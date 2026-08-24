import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { EinweisungService } from './einweisung.service';
import { FixedDateSource } from '../common/fixed-date-source';
import {
  MitgliedNichtGefundenError,
  KategorieNichtGefundenError,
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
  return { svc: new EinweisungService(db, dateSource), db };
}

function seedKategorie(db: any) {
  db.insert(schema.kategorie).values({
    id: 'kat-1', name: 'Bohrmaschinen', leihdauerTage: 7, wartungsintervallAusleihen: 10, einweisungspflichtig: true,
  }).run();
}

function seedMitglied(db: any) {
  db.insert(schema.mitglied).values({ id: 'M-001', name: 'Alice' }).run();
}

describe('EinweisungService', () => {
  it('UC-06: creates new Einweisung, returns { created: true }', () => {
    const { svc, db } = makeService();
    seedKategorie(db);
    seedMitglied(db);

    const result = svc.einweisungAnlegen('M-001', 'kat-1');
    expect(result.created).toBe(true);

    const all = db.select().from(schema.einweisung)
      .where(and(eq(schema.einweisung.mitgliedId, 'M-001'), eq(schema.einweisung.kategorieId, 'kat-1'))).all();
    expect(all).toHaveLength(1);
  });

  it('UC-06: idempotent — second call returns { created: false }, no duplicate', () => {
    const { svc, db } = makeService();
    seedKategorie(db);
    seedMitglied(db);

    svc.einweisungAnlegen('M-001', 'kat-1');
    const result = svc.einweisungAnlegen('M-001', 'kat-1');
    expect(result.created).toBe(false);

    const all = db.select().from(schema.einweisung)
      .where(and(eq(schema.einweisung.mitgliedId, 'M-001'), eq(schema.einweisung.kategorieId, 'kat-1'))).all();
    expect(all).toHaveLength(1);
  });

  it('UC-06: unknown mitgliedId → throws MitgliedNichtGefundenError', () => {
    const { svc, db } = makeService();
    seedKategorie(db);

    expect(() => svc.einweisungAnlegen('NONEXISTENT', 'kat-1'))
      .toThrow(MitgliedNichtGefundenError);
  });

  it('UC-06: unknown kategorieId → throws KategorieNichtGefundenError', () => {
    const { svc, db } = makeService();
    seedMitglied(db);

    expect(() => svc.einweisungAnlegen('M-001', 'NONEXISTENT'))
      .toThrow(KategorieNichtGefundenError);
  });
});
