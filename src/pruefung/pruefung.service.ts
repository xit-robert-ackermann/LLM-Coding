import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';
import { DateSource } from '../common/date-source.interface';
import { DATE_SOURCE } from '../common/date-source.token';
import { VormerkungService } from '../vormerkung/vormerkung.service';
import {
  AusleiheNichtGefundenError, GegenstandNichtInPruefungError,
  EingabeUngueltigError, AbzugUebersteigtKautionError,
} from '../errors/domain-errors';

export type Pruefergebnis = 'OK' | 'SCHADEN' | 'VERLOREN' | 'IRREPARABEL';

@Injectable()
export class PruefungService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: BetterSQLite3Database<typeof schema>,
    @Inject(DATE_SOURCE) private readonly dateSource: DateSource,
    private readonly vormerkungService: VormerkungService,
  ) {}

  pruefenAbschliessen(input: {
    ausleiheId: string;
    ergebnis: Pruefergebnis;
    abzug?: number;
    notiz?: string;
  }): void {
    const ausleihe = this.db.select().from(schema.ausleihe)
      .where(eq(schema.ausleihe.id, input.ausleiheId)).get();
    if (!ausleihe) throw new AusleiheNichtGefundenError(input.ausleiheId);

    const gegenstand = this.db.select().from(schema.gegenstand)
      .where(eq(schema.gegenstand.inventarnummer, ausleihe.gegenstandId)).get();
    if (!gegenstand || gegenstand.status !== 'IN_PRUEFUNG') {
      throw new GegenstandNichtInPruefungError('Gegenstand ist nicht in Prüfung.');
    }

    const hinterlegung = this.db.select().from(schema.kautionsbewegung)
      .where(and(
        eq(schema.kautionsbewegung.ausleiheId, input.ausleiheId),
        eq(schema.kautionsbewegung.typ, 'HINTERLEGUNG'),
      )).get();
    const kaution = hinterlegung?.betragEuro ?? 0;

    const jetzt = new Date().toISOString();

    let abzug = 0;
    let freigabe = kaution;

    if (input.ergebnis === 'OK') {
      abzug = 0; freigabe = kaution;
    } else if (input.ergebnis === 'SCHADEN') {
      if (input.abzug === undefined || input.abzug === null) {
        throw new EingabeUngueltigError('Abzug ist Pflichtparameter bei Ergebnis SCHADEN.');
      }
      if (input.abzug > kaution) {
        throw new AbzugUebersteigtKautionError(input.abzug, kaution);
      }
      abzug = input.abzug; freigabe = kaution - abzug;
    } else if (input.ergebnis === 'VERLOREN') {
      abzug = kaution; freigabe = 0;
    } else if (input.ergebnis === 'IRREPARABEL') {
      abzug = input.abzug ?? 0;
      if (abzug > kaution) throw new AbzugUebersteigtKautionError(abzug, kaution);
      freigabe = kaution - abzug;
    }

    if (abzug > 0) {
      this.db.insert(schema.kautionsbewegung).values({
        id: crypto.randomUUID(),
        ausleiheId: input.ausleiheId,
        typ: 'ABZUG',
        betragEuro: abzug,
        zeitstempel: jetzt,
        ausloeserId: 'wart',
      }).run();
    }
    if (freigabe > 0) {
      this.db.insert(schema.kautionsbewegung).values({
        id: crypto.randomUUID(),
        ausleiheId: input.ausleiheId,
        typ: 'FREIGABE',
        betragEuro: freigabe,
        zeitstempel: jetzt,
        ausloeserId: 'wart',
      }).run();
    }

    this.db.insert(schema.pruefprotokoll).values({
      id: crypto.randomUUID(),
      ausleiheId: input.ausleiheId,
      ergebnis: input.ergebnis,
      kautionsabzugEuro: abzug,
      notiz: input.notiz,
      erstelltAm: jetzt,
    }).run();

    this.db.update(schema.ausleihe)
      .set({ status: 'ABGESCHLOSSEN' })
      .where(eq(schema.ausleihe.id, input.ausleiheId))
      .run();

    const neuerZaehler = gegenstand.nutzungszaehler + 1;
    const kategorie = this.db.select().from(schema.kategorie)
      .where(eq(schema.kategorie.id, gegenstand.kategorieId)).get();

    let neuerStatus: string;
    if (input.ergebnis === 'VERLOREN' || input.ergebnis === 'IRREPARABEL') {
      neuerStatus = 'AUSGEMUSTERT';
    } else if (neuerZaehler >= (kategorie?.wartungsintervallAusleihen ?? Infinity)) {
      neuerStatus = 'WARTUNGSFAELLIG';
    } else {
      neuerStatus = 'VERFUEGBAR';
    }

    this.db.update(schema.gegenstand)
      .set({ status: neuerStatus, nutzungszaehler: neuerZaehler })
      .where(eq(schema.gegenstand.inventarnummer, ausleihe.gegenstandId))
      .run();

    this.db.insert(schema.zustandswechsel).values({
      id: crypto.randomUUID(),
      gegenstandId: ausleihe.gegenstandId,
      vonStatus: 'IN_PRUEFUNG',
      nachStatus: neuerStatus,
      grund: `pruefung:${input.ergebnis}`,
      zeitstempel: jetzt,
    }).run();

    if (neuerStatus === 'VERFUEGBAR') {
      this.vormerkungService.reservierungAnlegen(ausleihe.gegenstandId);
    }
  }
}
