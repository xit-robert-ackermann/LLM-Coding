import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';
import { DateSource } from '../common/date-source.interface';
import { DATE_SOURCE } from '../common/date-source.token';
import { MitgliedNichtGefundenError, KategorieNichtGefundenError } from '../errors/domain-errors';

@Injectable()
export class EinweisungService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: BetterSQLite3Database<typeof schema>,
    @Inject(DATE_SOURCE) private readonly dateSource: DateSource,
  ) {}

  einweisungAnlegen(mitgliedId: string, kategorieId: string): { created: boolean } {
    const m = this.db.select().from(schema.mitglied).where(eq(schema.mitglied.id, mitgliedId)).get();
    if (!m) throw new MitgliedNichtGefundenError(mitgliedId);

    const k = this.db.select().from(schema.kategorie).where(eq(schema.kategorie.id, kategorieId)).get();
    if (!k) throw new KategorieNichtGefundenError(kategorieId);

    const existing = this.db.select().from(schema.einweisung)
      .where(and(eq(schema.einweisung.mitgliedId, mitgliedId), eq(schema.einweisung.kategorieId, kategorieId)))
      .get();
    if (existing) return { created: false };

    this.db.insert(schema.einweisung).values({
      id: crypto.randomUUID(),
      mitgliedId,
      kategorieId,
      dokumentiertAm: new Date().toISOString(),
    }).run();
    return { created: true };
  }
}
