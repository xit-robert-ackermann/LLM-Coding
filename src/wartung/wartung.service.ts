import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';
import { VormerkungService } from '../vormerkung/vormerkung.service';
import { GegenstandNichtGefundenError, GegenstandNichtWartungsfaelligError } from '../errors/domain-errors';

@Injectable()
export class WartungService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly vormerkungService: VormerkungService,
  ) {}

  wartungAbschliessen(inventarnummer: string): void {
    const g = this.db.select().from(schema.gegenstand)
      .where(eq(schema.gegenstand.inventarnummer, inventarnummer)).get();
    if (!g) throw new GegenstandNichtGefundenError(inventarnummer);
    if (g.status !== 'WARTUNGSFAELLIG') {
      throw new GegenstandNichtWartungsfaelligError('Nur wartungsfällige Gegenstände können gewartet werden.');
    }

    this.db.update(schema.gegenstand)
      .set({ status: 'VERFUEGBAR', nutzungszaehler: 0 })
      .where(eq(schema.gegenstand.inventarnummer, inventarnummer))
      .run();

    this.db.insert(schema.zustandswechsel).values({
      id: crypto.randomUUID(),
      gegenstandId: inventarnummer,
      vonStatus: 'WARTUNGSFAELLIG',
      nachStatus: 'VERFUEGBAR',
      grund: 'wartung',
      zeitstempel: new Date().toISOString(),
    }).run();

    this.vormerkungService.reservierungAnlegen(inventarnummer);
  }
}
