import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';
import {
  EingabeUngueltigError, DuplikatError, KategorieNichtGefundenError,
  GegenstandNichtGefundenError, MitgliedNichtGefundenError,
} from '../errors/domain-errors';
import { DateSource } from '../common/date-source.interface';
import { DATE_SOURCE } from '../common/date-source.token';

export interface KategorieDto {
  id: string; name: string; leihdauerTage: number;
  wartungsintervall: number; einweisungspflicht: boolean;
}
export interface GegenstandDto {
  inventarnummer: string; kategorieId: string; bezeichnung?: string;
  wiederbeschaffungswertEuro: number; kaution: number;
  nutzungszaehler: number; status: string;
}
export interface MitgliedDto {
  id: string; name: string; gesperrt?: boolean;
}

@Injectable()
export class KatalogService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: BetterSQLite3Database<typeof schema>,
    @Inject(DATE_SOURCE) private readonly dateSource: DateSource,
  ) {}

  kategorieAnlegen(input: { name: string; leihdauerTage: number; wartungsintervall: number; einweisungspflicht: boolean }): KategorieDto {
    if (!input.name?.trim()) throw new EingabeUngueltigError('name ist Pflichtfeld.');
    if (!input.leihdauerTage || input.leihdauerTage < 1) throw new EingabeUngueltigError('leihdauerTage muss >= 1 sein.');
    if (!input.wartungsintervall || input.wartungsintervall < 1) throw new EingabeUngueltigError('wartungsintervall muss >= 1 sein.');
    if (input.einweisungspflicht === undefined || input.einweisungspflicht === null) throw new EingabeUngueltigError('einweisungspflicht ist Pflichtfeld.');

    const id = crypto.randomUUID();
    try {
      this.db.insert(schema.kategorie).values({
        id, name: input.name.trim(),
        leihdauerTage: input.leihdauerTage,
        wartungsintervallAusleihen: input.wartungsintervall,
        einweisungspflichtig: input.einweisungspflicht,
      }).run();
    } catch (e: any) {
      if (e?.message?.includes('UNIQUE')) throw new DuplikatError(`Kategorie '${input.name}' existiert bereits.`);
      throw e;
    }
    return { id, name: input.name.trim(), leihdauerTage: input.leihdauerTage, wartungsintervall: input.wartungsintervall, einweisungspflicht: input.einweisungspflicht };
  }

  kategorienAbfragen(): KategorieDto[] {
    return this.db.select().from(schema.kategorie).all().map(k => ({
      id: k.id, name: k.name, leihdauerTage: k.leihdauerTage,
      wartungsintervall: k.wartungsintervallAusleihen,
      einweisungspflicht: Boolean(k.einweisungspflichtig),
    }));
  }

  gegenstandAnlegen(input: { inventarnummer: string; kategorieId: string; bezeichnung: string; wiederbeschaffungswertEuro: number }): GegenstandDto {
    if (!input.inventarnummer?.trim()) throw new EingabeUngueltigError('inventarnummer ist Pflichtfeld.');
    if (!input.kategorieId?.trim()) throw new EingabeUngueltigError('kategorieId ist Pflichtfeld.');
    if (!input.bezeichnung?.trim()) throw new EingabeUngueltigError('bezeichnung ist Pflichtfeld.');
    if (!input.wiederbeschaffungswertEuro || input.wiederbeschaffungswertEuro < 1) throw new EingabeUngueltigError('wiederbeschaffungswertEuro muss >= 1 sein.');

    const kat = this.db.select().from(schema.kategorie).where(eq(schema.kategorie.id, input.kategorieId)).get();
    if (!kat) throw new KategorieNichtGefundenError(input.kategorieId);

    const kaution = Math.max(5, Math.min(100, Math.round(input.wiederbeschaffungswertEuro * 0.20)));
    try {
      this.db.insert(schema.gegenstand).values({
        inventarnummer: input.inventarnummer.trim(),
        kategorieId: input.kategorieId,
        wiederbeschaffungswertEuro: input.wiederbeschaffungswertEuro,
        nutzungszaehler: 0,
        status: 'VERFUEGBAR',
      }).run();
    } catch (e: any) {
      if (e?.message?.includes('UNIQUE')) throw new DuplikatError(`Inventarnummer '${input.inventarnummer}' bereits vergeben.`);
      throw e;
    }
    return { inventarnummer: input.inventarnummer.trim(), kategorieId: input.kategorieId, bezeichnung: input.bezeichnung.trim(), wiederbeschaffungswertEuro: input.wiederbeschaffungswertEuro, kaution, nutzungszaehler: 0, status: 'VERFUEGBAR' };
  }

  gegenstaendeAbfragen(filter?: { kategorieId?: string; status?: string }): GegenstandDto[] {
    const rows = this.db.select().from(schema.gegenstand).all();
    return rows
      .filter(g => !filter?.kategorieId || g.kategorieId === filter.kategorieId)
      .filter(g => !filter?.status || g.status === filter.status)
      .map(g => ({
        inventarnummer: g.inventarnummer,
        kategorieId: g.kategorieId,
        wiederbeschaffungswertEuro: g.wiederbeschaffungswertEuro,
        kaution: Math.max(5, Math.min(100, Math.round(g.wiederbeschaffungswertEuro * 0.20))),
        nutzungszaehler: g.nutzungszaehler,
        status: g.status,
      }));
  }

  gegenstandAbfragen(inventarnummer: string): GegenstandDto {
    const g = this.db.select().from(schema.gegenstand).where(eq(schema.gegenstand.inventarnummer, inventarnummer)).get();
    if (!g) throw new GegenstandNichtGefundenError(inventarnummer);
    return {
      inventarnummer: g.inventarnummer,
      kategorieId: g.kategorieId,
      wiederbeschaffungswertEuro: g.wiederbeschaffungswertEuro,
      kaution: Math.max(5, Math.min(100, Math.round(g.wiederbeschaffungswertEuro * 0.20))),
      nutzungszaehler: g.nutzungszaehler,
      status: g.status,
    };
  }

  mitgliedAnlegen(input: { name: string }): MitgliedDto {
    if (!input.name?.trim()) throw new EingabeUngueltigError('name ist Pflichtfeld und darf nicht leer sein.');
    const id = crypto.randomUUID();
    this.db.insert(schema.mitglied).values({ id, name: input.name.trim() }).run();
    return { id, name: input.name.trim() };
  }

  mitgliedAbfragen(id: string): MitgliedDto & { gesperrt: boolean } {
    const m = this.db.select().from(schema.mitglied).where(eq(schema.mitglied.id, id)).get();
    if (!m) throw new MitgliedNichtGefundenError(id);

    const today = this.dateSource.today().toISOString().split('T')[0];
    const offeneAusleihen = this.db.select({
      id: schema.ausleihe.id,
      rueckgabeFrist: schema.ausleihe.rueckgabeFrist,
      gegenstandId: schema.ausleihe.gegenstandId,
    })
      .from(schema.ausleihe)
      .where(and(eq(schema.ausleihe.mitgliedId, id), eq(schema.ausleihe.status, 'OFFEN')))
      .all();

    let gesperrt = false;
    for (const a of offeneAusleihen) {
      if (a.rueckgabeFrist < today) {
        const g = this.db.select({ status: schema.gegenstand.status })
          .from(schema.gegenstand)
          .where(eq(schema.gegenstand.inventarnummer, a.gegenstandId))
          .get();
        if (g?.status !== 'IN_PRUEFUNG') { gesperrt = true; break; }
      }
    }

    return { id: m.id, name: m.name, gesperrt };
  }
}
