export declare const kategorie: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "kategorie";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "kategorie";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "name";
            tableName: "kategorie";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        leihdauerTage: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "leihdauer_tage";
            tableName: "kategorie";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        wartungsintervallAusleihen: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "wartungsintervall_ausleihen";
            tableName: "kategorie";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        einweisungspflichtig: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "einweisungspflichtig";
            tableName: "kategorie";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const gegenstand: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "gegenstand";
    schema: undefined;
    columns: {
        inventarnummer: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "inventarnummer";
            tableName: "gegenstand";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        kategorieId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "kategorie_id";
            tableName: "gegenstand";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        wiederbeschaffungswertEuro: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "wiederbeschaffungswert_euro";
            tableName: "gegenstand";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        nutzungszaehler: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "nutzungszaehler";
            tableName: "gegenstand";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        status: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "status";
            tableName: "gegenstand";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const mitglied: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "mitglied";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "mitglied";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        name: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "name";
            tableName: "mitglied";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const ausleihe: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "ausleihe";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        gegenstandId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "gegenstand_id";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        mitgliedId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "mitglied_id";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        ausgabeDatum: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ausgabe_datum";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        rueckgabeFrist: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "rueckgabe_frist";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        verlaengert: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "verlaengert";
            tableName: "ausleihe";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        auffaelligkeiten: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "auffaelligkeiten";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "status";
            tableName: "ausleihe";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const pruefprotokoll: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "pruefprotokoll";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "pruefprotokoll";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        ausleiheId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ausleihe_id";
            tableName: "pruefprotokoll";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        ergebnis: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ergebnis";
            tableName: "pruefprotokoll";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        kautionsabzugEuro: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "kautionsabzug_euro";
            tableName: "pruefprotokoll";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        notiz: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "notiz";
            tableName: "pruefprotokoll";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        erstelltAm: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "erstellt_am";
            tableName: "pruefprotokoll";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const kautionsbewegung: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "kautionsbewegung";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "kautionsbewegung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        ausleiheId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ausleihe_id";
            tableName: "kautionsbewegung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        typ: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "typ";
            tableName: "kautionsbewegung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        betragEuro: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "betrag_euro";
            tableName: "kautionsbewegung";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            enumValues: undefined;
            baseColumn: never;
        }, object>;
        zeitstempel: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "zeitstempel";
            tableName: "kautionsbewegung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        ausloeserId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ausloeserId";
            tableName: "kautionsbewegung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const vormerkung: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "vormerkung";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "vormerkung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        mitgliedId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "mitglied_id";
            tableName: "vormerkung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        kategorieId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "kategorie_id";
            tableName: "vormerkung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        eingangszeit: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "eingangszeit";
            tableName: "vormerkung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "status";
            tableName: "vormerkung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const reservierung: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "reservierung";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "reservierung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        gegenstandId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "gegenstand_id";
            tableName: "reservierung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        mitgliedId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "mitglied_id";
            tableName: "reservierung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        entstandenAm: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "entstanden_am";
            tableName: "reservierung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        verfaelltAm: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "verfaellt_am";
            tableName: "reservierung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        status: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "status";
            tableName: "reservierung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const einweisung: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "einweisung";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "einweisung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        mitgliedId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "mitglied_id";
            tableName: "einweisung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        kategorieId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "kategorie_id";
            tableName: "einweisung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        dokumentiertAm: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "dokumentiert_am";
            tableName: "einweisung";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
export declare const zustandswechsel: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "zustandswechsel";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "zustandswechsel";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        gegenstandId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "gegenstand_id";
            tableName: "zustandswechsel";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        vonStatus: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "von_status";
            tableName: "zustandswechsel";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        nachStatus: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "nach_status";
            tableName: "zustandswechsel";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        grund: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "grund";
            tableName: "zustandswechsel";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
        zeitstempel: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "zeitstempel";
            tableName: "zustandswechsel";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
        }, object>;
    };
    dialect: "sqlite";
}>;
