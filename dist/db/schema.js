"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.einweisung = exports.reservierung = exports.vormerkung = exports.kautionsbewegung = exports.pruefprotokoll = exports.ausleihe = exports.mitglied = exports.gegenstand = exports.kategorie = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.kategorie = (0, sqlite_core_1.sqliteTable)('kategorie', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull().unique(),
    leihdauerTage: (0, sqlite_core_1.integer)('leihdauer_tage').notNull(),
    wartungsintervallAusleihen: (0, sqlite_core_1.integer)('wartungsintervall_ausleihen').notNull(),
    einweisungspflichtig: (0, sqlite_core_1.integer)('einweisungspflichtig', { mode: 'boolean' }).notNull(),
});
exports.gegenstand = (0, sqlite_core_1.sqliteTable)('gegenstand', {
    inventarnummer: (0, sqlite_core_1.text)('inventarnummer').primaryKey(),
    kategorieId: (0, sqlite_core_1.text)('kategorie_id').notNull().references(() => exports.kategorie.id),
    wiederbeschaffungswertEuro: (0, sqlite_core_1.integer)('wiederbeschaffungswert_euro').notNull(),
    nutzungszaehler: (0, sqlite_core_1.integer)('nutzungszaehler').notNull().default(0),
    status: (0, sqlite_core_1.text)('status').notNull().default('VERFUEGBAR'),
});
exports.mitglied = (0, sqlite_core_1.sqliteTable)('mitglied', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
});
exports.ausleihe = (0, sqlite_core_1.sqliteTable)('ausleihe', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    gegenstandId: (0, sqlite_core_1.text)('gegenstand_id').notNull().references(() => exports.gegenstand.inventarnummer),
    mitgliedId: (0, sqlite_core_1.text)('mitglied_id').notNull().references(() => exports.mitglied.id),
    ausgabeDatum: (0, sqlite_core_1.text)('ausgabe_datum').notNull(),
    rueckgabeFrist: (0, sqlite_core_1.text)('rueckgabe_frist').notNull(),
    verlaengert: (0, sqlite_core_1.integer)('verlaengert', { mode: 'boolean' }).notNull().default(false),
    auffaelligkeiten: (0, sqlite_core_1.text)('auffaelligkeiten'),
    status: (0, sqlite_core_1.text)('status').notNull().default('OFFEN'),
});
exports.pruefprotokoll = (0, sqlite_core_1.sqliteTable)('pruefprotokoll', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    ausleiheId: (0, sqlite_core_1.text)('ausleihe_id').notNull().unique().references(() => exports.ausleihe.id),
    ergebnis: (0, sqlite_core_1.text)('ergebnis').notNull(),
    kautionsabzugEuro: (0, sqlite_core_1.integer)('kautionsabzug_euro').notNull().default(0),
    notiz: (0, sqlite_core_1.text)('notiz'),
    erstelltAm: (0, sqlite_core_1.text)('erstellt_am').notNull(),
});
exports.kautionsbewegung = (0, sqlite_core_1.sqliteTable)('kautionsbewegung', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    ausleiheId: (0, sqlite_core_1.text)('ausleihe_id').notNull().references(() => exports.ausleihe.id),
    typ: (0, sqlite_core_1.text)('typ').notNull(),
    betragEuro: (0, sqlite_core_1.integer)('betrag_euro').notNull(),
    zeitstempel: (0, sqlite_core_1.text)('zeitstempel').notNull(),
    ausloeserId: (0, sqlite_core_1.text)('ausloeserId').notNull(),
});
exports.vormerkung = (0, sqlite_core_1.sqliteTable)('vormerkung', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    mitgliedId: (0, sqlite_core_1.text)('mitglied_id').notNull().references(() => exports.mitglied.id),
    kategorieId: (0, sqlite_core_1.text)('kategorie_id').notNull().references(() => exports.kategorie.id),
    eingangszeit: (0, sqlite_core_1.text)('eingangszeit').notNull(),
    status: (0, sqlite_core_1.text)('status').notNull().default('WARTEND'),
});
exports.reservierung = (0, sqlite_core_1.sqliteTable)('reservierung', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    gegenstandId: (0, sqlite_core_1.text)('gegenstand_id').notNull().references(() => exports.gegenstand.inventarnummer),
    mitgliedId: (0, sqlite_core_1.text)('mitglied_id').notNull().references(() => exports.mitglied.id),
    entstandenAm: (0, sqlite_core_1.text)('entstanden_am').notNull(),
    verfaelltAm: (0, sqlite_core_1.text)('verfaellt_am').notNull(),
    status: (0, sqlite_core_1.text)('status').notNull().default('AKTIV'),
});
exports.einweisung = (0, sqlite_core_1.sqliteTable)('einweisung', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    mitgliedId: (0, sqlite_core_1.text)('mitglied_id').notNull().references(() => exports.mitglied.id),
    kategorieId: (0, sqlite_core_1.text)('kategorie_id').notNull().references(() => exports.kategorie.id),
    dokumentiertAm: (0, sqlite_core_1.text)('dokumentiert_am').notNull(),
});
//# sourceMappingURL=schema.js.map