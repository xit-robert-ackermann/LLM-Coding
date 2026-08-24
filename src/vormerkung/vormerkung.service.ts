import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, asc } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';
import { DateSource } from '../common/date-source.interface';
import { DATE_SOURCE } from '../common/date-source.token';
import {
  KategorieNichtGefundenError,
  BereitsVorgemerktError,
  VormerkungNichtGefundenError,
  ReservierungNichtGefundenError,
} from '../errors/domain-errors';

export interface VormerkungDto {
  id: string;
  mitgliedId: string;
  kategorieId: string;
  eingangszeit: string;
  status: string;
}

@Injectable()
export class VormerkungService {
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

  private isMitgliedGesperrt(mitgliedId: string): boolean {
    const today = this.today();
    const offene = this.db
      .select({ rueckgabeFrist: schema.ausleihe.rueckgabeFrist, gegenstandId: schema.ausleihe.gegenstandId })
      .from(schema.ausleihe)
      .where(and(eq(schema.ausleihe.mitgliedId, mitgliedId), eq(schema.ausleihe.status, 'OFFEN')))
      .all();
    for (const a of offene) {
      if (a.rueckgabeFrist < today) {
        const g = this.db
          .select({ status: schema.gegenstand.status })
          .from(schema.gegenstand)
          .where(eq(schema.gegenstand.inventarnummer, a.gegenstandId))
          .get();
        if (g?.status !== 'IN_PRUEFUNG') return true;
      }
    }
    return false;
  }

  vormerken(input: { mitgliedId: string; kategorieId: string }): VormerkungDto {
    const kat = this.db.select().from(schema.kategorie).where(eq(schema.kategorie.id, input.kategorieId)).get();
    if (!kat) throw new KategorieNichtGefundenError(input.kategorieId);

    this.verfalleneReservierungenBereinigen(input.kategorieId);

    const existing = this.db
      .select()
      .from(schema.vormerkung)
      .where(
        and(
          eq(schema.vormerkung.mitgliedId, input.mitgliedId),
          eq(schema.vormerkung.kategorieId, input.kategorieId),
          eq(schema.vormerkung.status, 'WARTEND'),
        ),
      )
      .get();
    if (existing) throw new BereitsVorgemerktError('Mitglied hat bereits eine Vormerkung für diese Kategorie.');

    const id = crypto.randomUUID();
    const eingangszeit = new Date().toISOString();
    this.db
      .insert(schema.vormerkung)
      .values({ id, mitgliedId: input.mitgliedId, kategorieId: input.kategorieId, eingangszeit, status: 'WARTEND' })
      .run();
    return { id, mitgliedId: input.mitgliedId, kategorieId: input.kategorieId, eingangszeit, status: 'WARTEND' };
  }

  stornieren(vormerkungId: string): void {
    const vm = this.db.select().from(schema.vormerkung).where(eq(schema.vormerkung.id, vormerkungId)).get();
    if (!vm) throw new VormerkungNichtGefundenError('Vormerkung nicht gefunden.');

    // Mark STORNIERT first so the cascade does not re-assign to this member
    this.db.update(schema.vormerkung).set({ status: 'STORNIERT' }).where(eq(schema.vormerkung.id, vormerkungId)).run();

    // Check if this Vormerkung led to an active Reservierung for the same member
    const res = this.db
      .select()
      .from(schema.reservierung)
      .where(and(eq(schema.reservierung.mitgliedId, vm.mitgliedId), eq(schema.reservierung.status, 'AKTIV')))
      .get();

    if (res) {
      this.db.update(schema.reservierung).set({ status: 'VERFALLEN' }).where(eq(schema.reservierung.id, res.id)).run();
      this.db
        .update(schema.gegenstand)
        .set({ status: 'VERFUEGBAR' })
        .where(eq(schema.gegenstand.inventarnummer, res.gegenstandId))
        .run();
      this.reservierungAnlegen(res.gegenstandId);
    }
  }

  reservierungStornieren(reservierungId: string): void {
    const res = this.db.select().from(schema.reservierung).where(eq(schema.reservierung.id, reservierungId)).get();
    if (!res) throw new ReservierungNichtGefundenError('Reservierung nicht gefunden.');

    this.db.update(schema.reservierung).set({ status: 'VERFALLEN' }).where(eq(schema.reservierung.id, reservierungId)).run();
    this.db
      .update(schema.gegenstand)
      .set({ status: 'VERFUEGBAR' })
      .where(eq(schema.gegenstand.inventarnummer, res.gegenstandId))
      .run();
    this.reservierungAnlegen(res.gegenstandId);
  }

  reservierungAnlegen(gegenstandId: string): void {
    const g = this.db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, gegenstandId)).get();
    if (!g) return;

    // BR-032: no reservation for WARTUNGSFAELLIG items
    if (g.status === 'WARTUNGSFAELLIG') return;

    // BR-028: FIFO queue for WARTEND Vormerkungen in this kategorie
    const queue = this.db
      .select()
      .from(schema.vormerkung)
      .where(and(eq(schema.vormerkung.kategorieId, g.kategorieId), eq(schema.vormerkung.status, 'WARTEND')))
      .orderBy(asc(schema.vormerkung.eingangszeit))
      .all();

    for (const vm of queue) {
      // BR-033: skip gesperrte Mitglieder (they keep their place in queue)
      if (this.isMitgliedGesperrt(vm.mitgliedId)) continue;

      const today = this.today();
      const reservierungId = crypto.randomUUID();
      this.db
        .insert(schema.reservierung)
        .values({
          id: reservierungId,
          gegenstandId,
          mitgliedId: vm.mitgliedId,
          entstandenAm: today,
          verfaelltAm: this.addDays(today, 3),
          status: 'AKTIV',
        })
        .run();

      this.db
        .update(schema.gegenstand)
        .set({ status: 'RESERVIERT' })
        .where(eq(schema.gegenstand.inventarnummer, gegenstandId))
        .run();

      return;
    }
    // Queue empty or all gesperrt → Gegenstand stays VERFUEGBAR
  }

  verfalleneReservierungenBereinigen(kategorieId?: string): void {
    const today = this.today();
    let aktiveRes = this.db.select().from(schema.reservierung).where(eq(schema.reservierung.status, 'AKTIV')).all();

    if (kategorieId) {
      aktiveRes = aktiveRes.filter((r) => {
        const g = this.db
          .select({ kategorieId: schema.gegenstand.kategorieId })
          .from(schema.gegenstand)
          .where(eq(schema.gegenstand.inventarnummer, r.gegenstandId))
          .get();
        return g?.kategorieId === kategorieId;
      });
    }

    for (const res of aktiveRes) {
      if (res.verfaelltAm < today) {
        this.db.update(schema.reservierung).set({ status: 'VERFALLEN' }).where(eq(schema.reservierung.id, res.id)).run();
        this.db
          .update(schema.gegenstand)
          .set({ status: 'VERFUEGBAR' })
          .where(eq(schema.gegenstand.inventarnummer, res.gegenstandId))
          .run();
        this.reservierungAnlegen(res.gegenstandId);
      }
    }
  }

  vormerkungenAbfragen(filter?: { kategorieId?: string; mitgliedId?: string }): VormerkungDto[] {
    return this.db
      .select()
      .from(schema.vormerkung)
      .all()
      .filter((v) => !filter?.kategorieId || v.kategorieId === filter.kategorieId)
      .filter((v) => !filter?.mitgliedId || v.mitgliedId === filter.mitgliedId)
      .map((v) => ({
        id: v.id,
        mitgliedId: v.mitgliedId,
        kategorieId: v.kategorieId,
        eingangszeit: v.eingangszeit,
        status: v.status,
      }));
  }
}
