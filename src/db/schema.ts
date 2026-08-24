import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const kategorie = sqliteTable('kategorie', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  leihdauerTage: integer('leihdauer_tage').notNull(),
  wartungsintervallAusleihen: integer('wartungsintervall_ausleihen').notNull(),
  einweisungspflichtig: integer('einweisungspflichtig', { mode: 'boolean' }).notNull(),
});

export const gegenstand = sqliteTable('gegenstand', {
  inventarnummer: text('inventarnummer').primaryKey(),
  kategorieId: text('kategorie_id').notNull().references(() => kategorie.id),
  wiederbeschaffungswertEuro: integer('wiederbeschaffungswert_euro').notNull(),
  nutzungszaehler: integer('nutzungszaehler').notNull().default(0),
  status: text('status').notNull().default('VERFUEGBAR'),
});

export const mitglied = sqliteTable('mitglied', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const ausleihe = sqliteTable('ausleihe', {
  id: text('id').primaryKey(),
  gegenstandId: text('gegenstand_id').notNull().references(() => gegenstand.inventarnummer),
  mitgliedId: text('mitglied_id').notNull().references(() => mitglied.id),
  ausgabeDatum: text('ausgabe_datum').notNull(),
  rueckgabeFrist: text('rueckgabe_frist').notNull(),
  verlaengert: integer('verlaengert', { mode: 'boolean' }).notNull().default(false),
  auffaelligkeiten: text('auffaelligkeiten'),
  status: text('status').notNull().default('OFFEN'),
});

export const pruefprotokoll = sqliteTable('pruefprotokoll', {
  id: text('id').primaryKey(),
  ausleiheId: text('ausleihe_id').notNull().unique().references(() => ausleihe.id),
  ergebnis: text('ergebnis').notNull(),
  kautionsabzugEuro: integer('kautionsabzug_euro').notNull().default(0),
  notiz: text('notiz'),
  erstelltAm: text('erstellt_am').notNull(),
});

export const kautionsbewegung = sqliteTable('kautionsbewegung', {
  id: text('id').primaryKey(),
  ausleiheId: text('ausleihe_id').notNull().references(() => ausleihe.id),
  typ: text('typ').notNull(),
  betragEuro: integer('betrag_euro').notNull(),
  zeitstempel: text('zeitstempel').notNull(),
  ausloeserId: text('ausloeserId').notNull(),
});

export const vormerkung = sqliteTable('vormerkung', {
  id: text('id').primaryKey(),
  mitgliedId: text('mitglied_id').notNull().references(() => mitglied.id),
  kategorieId: text('kategorie_id').notNull().references(() => kategorie.id),
  eingangszeit: text('eingangszeit').notNull(),
  status: text('status').notNull().default('WARTEND'),
});

export const reservierung = sqliteTable('reservierung', {
  id: text('id').primaryKey(),
  gegenstandId: text('gegenstand_id').notNull().references(() => gegenstand.inventarnummer),
  mitgliedId: text('mitglied_id').notNull().references(() => mitglied.id),
  entstandenAm: text('entstanden_am').notNull(),
  verfaelltAm: text('verfaellt_am').notNull(),
  status: text('status').notNull().default('AKTIV'),
});

export const einweisung = sqliteTable('einweisung', {
  id: text('id').primaryKey(),
  mitgliedId: text('mitglied_id').notNull().references(() => mitglied.id),
  kategorieId: text('kategorie_id').notNull().references(() => kategorie.id),
  dokumentiertAm: text('dokumentiert_am').notNull(),
});
