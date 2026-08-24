import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, count } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';
import { DateSource } from '../common/date-source.interface';
import { DATE_SOURCE } from '../common/date-source.token';
import {
  MitgliedNichtGefundenError, GegenstandNichtGefundenError, AusleiheNichtGefundenError,
  MitgliedGesperrtError, MaxAusleihenErreichtError, GegenstandNichtVerfuegbarError,
  EinweisungFehltError, BereitsVerlaengertError, AusleiheUeberfaelligError,
  VormerkungVorhandenError, AusleiheNichtOffenError,
} from '../errors/domain-errors';

export interface AusleiheDto {
  id: string;
  gegenstandId: string;
  mitgliedId: string;
  ausgabeDatum: string;
  rueckgabeFrist: string;
  verlaengert: boolean;
  auffaelligkeiten?: string | null;
  status: string;
  kautionEuro?: number;
}

@Injectable()
export class AusleiheService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: BetterSQLite3Database<typeof schema>,
    @Inject(DATE_SOURCE) private readonly dateSource: DateSource,
  ) {}

  private today(): string {
    return this.dateSource.today().toISOString().split('T')[0];
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
  }

  private berechnKaution(wiederbeschaffungswert: number): number {
    return Math.max(5, Math.min(100, Math.round(wiederbeschaffungswert * 0.20)));
  }

  private isMitgliedGesperrt(mitgliedId: string, today: string): boolean {
    const offene = this.db.select({
      rueckgabeFrist: schema.ausleihe.rueckgabeFrist,
      gegenstandId: schema.ausleihe.gegenstandId,
    }).from(schema.ausleihe)
      .where(and(eq(schema.ausleihe.mitgliedId, mitgliedId), eq(schema.ausleihe.status, 'OFFEN')))
      .all();

    for (const a of offene) {
      if (a.rueckgabeFrist < today) {
        const g = this.db.select({ status: schema.gegenstand.status })
          .from(schema.gegenstand)
          .where(eq(schema.gegenstand.inventarnummer, a.gegenstandId))
          .get();
        if (g?.status !== 'IN_PRUEFUNG') return true;
      }
    }
    return false;
  }

  ausgeben(input: { gegenstandId: string; mitgliedId: string }): AusleiheDto {
    const today = this.today();

    const mitglied = this.db.select().from(schema.mitglied)
      .where(eq(schema.mitglied.id, input.mitgliedId)).get();
    if (!mitglied) throw new MitgliedNichtGefundenError(input.mitgliedId);

    if (this.isMitgliedGesperrt(input.mitgliedId, today)) {
      throw new MitgliedGesperrtError('Mitglied hat mindestens eine überfällige Ausleihe.');
    }

    const activeCount = this.db.select({ cnt: count() }).from(schema.ausleihe)
      .where(and(eq(schema.ausleihe.mitgliedId, input.mitgliedId), eq(schema.ausleihe.status, 'OFFEN')))
      .get();
    if ((activeCount?.cnt ?? 0) >= 3) {
      throw new MaxAusleihenErreichtError('Mitglied hat bereits 3 offene Ausleihen.');
    }

    const gegenstand = this.db.select().from(schema.gegenstand)
      .where(eq(schema.gegenstand.inventarnummer, input.gegenstandId)).get();
    if (!gegenstand) throw new GegenstandNichtGefundenError(input.gegenstandId);

    if (gegenstand.status !== 'VERFUEGBAR') {
      if (gegenstand.status === 'RESERVIERT') {
        const res = this.db.select().from(schema.reservierung)
          .where(and(
            eq(schema.reservierung.gegenstandId, input.gegenstandId),
            eq(schema.reservierung.mitgliedId, input.mitgliedId),
            eq(schema.reservierung.status, 'AKTIV'),
          )).get();
        if (!res) throw new GegenstandNichtVerfuegbarError('Gegenstand ist reserviert für ein anderes Mitglied.');
        this.db.update(schema.reservierung)
          .set({ status: 'ABGEHOLT' })
          .where(eq(schema.reservierung.id, res.id))
          .run();
      } else {
        throw new GegenstandNichtVerfuegbarError(`Gegenstand hat Status ${gegenstand.status}.`);
      }
    }

    const kategorie = this.db.select().from(schema.kategorie)
      .where(eq(schema.kategorie.id, gegenstand.kategorieId)).get();
    if (kategorie?.einweisungspflichtig) {
      const einweisung = this.db.select().from(schema.einweisung)
        .where(and(
          eq(schema.einweisung.mitgliedId, input.mitgliedId),
          eq(schema.einweisung.kategorieId, gegenstand.kategorieId),
        )).get();
      if (!einweisung) throw new EinweisungFehltError('Einweisung für diese Kategorie fehlt.');
    }

    const leihdauer = kategorie?.leihdauerTage ?? 7;
    const rueckgabeFrist = this.addDays(today, leihdauer);
    const kaution = this.berechnKaution(gegenstand.wiederbeschaffungswertEuro);

    const ausleiheId = crypto.randomUUID();
    this.db.insert(schema.ausleihe).values({
      id: ausleiheId,
      gegenstandId: input.gegenstandId,
      mitgliedId: input.mitgliedId,
      ausgabeDatum: today,
      rueckgabeFrist,
      verlaengert: false,
      status: 'OFFEN',
    }).run();

    this.db.update(schema.gegenstand)
      .set({ status: 'AUSGELIEHEN' })
      .where(eq(schema.gegenstand.inventarnummer, input.gegenstandId))
      .run();

    this.db.insert(schema.kautionsbewegung).values({
      id: crypto.randomUUID(),
      ausleiheId,
      typ: 'HINTERLEGUNG',
      betragEuro: kaution,
      zeitstempel: new Date().toISOString(),
      ausloeserId: input.mitgliedId,
    }).run();

    return {
      id: ausleiheId,
      gegenstandId: input.gegenstandId,
      mitgliedId: input.mitgliedId,
      ausgabeDatum: today,
      rueckgabeFrist,
      verlaengert: false,
      status: 'OFFEN',
      kautionEuro: kaution,
    };
  }

  verlaengern(ausleiheId: string): AusleiheDto {
    const today = this.today();

    const ausleihe = this.db.select().from(schema.ausleihe)
      .where(eq(schema.ausleihe.id, ausleiheId)).get();
    if (!ausleihe) throw new AusleiheNichtGefundenError(ausleiheId);
    if (ausleihe.status !== 'OFFEN') throw new AusleiheNichtOffenError('Ausleihe ist nicht offen.');
    if (ausleihe.verlaengert) throw new BereitsVerlaengertError('Ausleihe wurde bereits verlängert.');
    if (ausleihe.rueckgabeFrist < today) throw new AusleiheUeberfaelligError('Ausleihe ist überfällig.');

    const gegenstand = this.db.select({ kategorieId: schema.gegenstand.kategorieId })
      .from(schema.gegenstand)
      .where(eq(schema.gegenstand.inventarnummer, ausleihe.gegenstandId)).get();

    const vormerkung = this.db.select().from(schema.vormerkung)
      .where(and(
        eq(schema.vormerkung.kategorieId, gegenstand!.kategorieId),
        eq(schema.vormerkung.status, 'WARTEND'),
      )).get();
    if (vormerkung) throw new VormerkungVorhandenError('Offene Vormerkung für diese Kategorie vorhanden.');

    const kategorie = this.db.select({ leihdauerTage: schema.kategorie.leihdauerTage })
      .from(schema.kategorie)
      .where(eq(schema.kategorie.id, gegenstand!.kategorieId)).get();
    const neueFrist = this.addDays(ausleihe.rueckgabeFrist, kategorie?.leihdauerTage ?? 7);

    this.db.update(schema.ausleihe)
      .set({ verlaengert: true, rueckgabeFrist: neueFrist })
      .where(eq(schema.ausleihe.id, ausleiheId))
      .run();

    return { ...ausleihe, verlaengert: true, rueckgabeFrist: neueFrist };
  }

  rueckgabeEntgegennehmen(ausleiheId: string, auffaelligkeiten?: string): AusleiheDto {
    const ausleihe = this.db.select().from(schema.ausleihe)
      .where(eq(schema.ausleihe.id, ausleiheId)).get();
    if (!ausleihe) throw new AusleiheNichtGefundenError(ausleiheId);
    if (ausleihe.status !== 'OFFEN') throw new AusleiheNichtOffenError('Ausleihe ist nicht offen.');

    const gegenstand = this.db.select({ status: schema.gegenstand.status })
      .from(schema.gegenstand)
      .where(eq(schema.gegenstand.inventarnummer, ausleihe.gegenstandId)).get();
    if (gegenstand?.status !== 'AUSGELIEHEN') throw new AusleiheNichtOffenError('Gegenstand ist nicht im Status AUSGELIEHEN.');

    this.db.update(schema.gegenstand)
      .set({ status: 'IN_PRUEFUNG' })
      .where(eq(schema.gegenstand.inventarnummer, ausleihe.gegenstandId))
      .run();

    if (auffaelligkeiten !== undefined) {
      this.db.update(schema.ausleihe)
        .set({ auffaelligkeiten })
        .where(eq(schema.ausleihe.id, ausleiheId))
        .run();
    }

    return { ...ausleihe, auffaelligkeiten: auffaelligkeiten ?? ausleihe.auffaelligkeiten };
  }

  ausleihenAbfragen(filter?: { status?: string; mitgliedId?: string; ueberfaellig?: boolean }): AusleiheDto[] {
    const today = this.today();
    const rows = this.db.select().from(schema.ausleihe).all();
    return rows
      .filter(a => !filter?.status || a.status === filter.status)
      .filter(a => !filter?.mitgliedId || a.mitgliedId === filter.mitgliedId)
      .filter(a => {
        if (!filter?.ueberfaellig) return true;
        return a.status === 'OFFEN' && a.rueckgabeFrist < today;
      })
      .map(a => ({
        id: a.id, gegenstandId: a.gegenstandId, mitgliedId: a.mitgliedId,
        ausgabeDatum: a.ausgabeDatum, rueckgabeFrist: a.rueckgabeFrist,
        verlaengert: Boolean(a.verlaengert), auffaelligkeiten: a.auffaelligkeiten,
        status: a.status,
      }));
  }
}
