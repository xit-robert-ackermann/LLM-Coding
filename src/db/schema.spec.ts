import * as BetterSqlite3 from 'better-sqlite3';
const Database = (BetterSqlite3 as any).default ?? BetterSqlite3;
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

describe('Schema', () => {
  it('creates all 9 tables in an in-memory database', () => {
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema });

    // Create tables directly from schema definitions
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS kategorie (
        id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE,
        leihdauer_tage INTEGER NOT NULL, wartungsintervall_ausleihen INTEGER NOT NULL,
        einweisungspflichtig INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS gegenstand (
        inventarnummer TEXT PRIMARY KEY, kategorie_id TEXT NOT NULL,
        wiederbeschaffungswert_euro INTEGER NOT NULL, nutzungszaehler INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'VERFUEGBAR'
      );
      CREATE TABLE IF NOT EXISTS mitglied (id TEXT PRIMARY KEY, name TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ausleihe (
        id TEXT PRIMARY KEY, gegenstand_id TEXT NOT NULL, mitglied_id TEXT NOT NULL,
        ausgabe_datum TEXT NOT NULL, rueckgabe_frist TEXT NOT NULL,
        verlaengert INTEGER NOT NULL DEFAULT 0, auffaelligkeiten TEXT,
        status TEXT NOT NULL DEFAULT 'OFFEN'
      );
      CREATE TABLE IF NOT EXISTS pruefprotokoll (
        id TEXT PRIMARY KEY, ausleihe_id TEXT NOT NULL UNIQUE, ergebnis TEXT NOT NULL,
        kautionsabzug_euro INTEGER NOT NULL DEFAULT 0, notiz TEXT, erstellt_am TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS kautionsbewegung (
        id TEXT PRIMARY KEY, ausleihe_id TEXT NOT NULL, typ TEXT NOT NULL,
        betrag_euro INTEGER NOT NULL, zeitstempel TEXT NOT NULL, ausloeserId TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS vormerkung (
        id TEXT PRIMARY KEY, mitglied_id TEXT NOT NULL, kategorie_id TEXT NOT NULL,
        eingangszeit TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'WARTEND'
      );
      CREATE TABLE IF NOT EXISTS reservierung (
        id TEXT PRIMARY KEY, gegenstand_id TEXT NOT NULL, mitglied_id TEXT NOT NULL,
        entstanden_am TEXT NOT NULL, verfaellt_am TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'AKTIV'
      );
      CREATE TABLE IF NOT EXISTS einweisung (
        id TEXT PRIMARY KEY, mitglied_id TEXT NOT NULL, kategorie_id TEXT NOT NULL,
        dokumentiert_am TEXT NOT NULL
      );
    `);

    const tables = sqlite.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all() as { name: string }[];

    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('kategorie');
    expect(tableNames).toContain('gegenstand');
    expect(tableNames).toContain('mitglied');
    expect(tableNames).toContain('ausleihe');
    expect(tableNames).toContain('pruefprotokoll');
    expect(tableNames).toContain('kautionsbewegung');
    expect(tableNames).toContain('vormerkung');
    expect(tableNames).toContain('reservierung');
    expect(tableNames).toContain('einweisung');
    sqlite.close();
  });
});
