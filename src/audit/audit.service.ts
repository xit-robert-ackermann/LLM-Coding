import { Injectable, Inject } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DB_TOKEN } from '../db/database.module';

@Injectable()
export class AuditService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  auditAbfragen(filter?: { von?: string; bis?: string; gegenstandId?: string }): any[] {
    const kautionen = this.db.select().from(schema.kautionsbewegung).all()
      .filter(k => {
        if (!filter?.gegenstandId) return true;
        const a = this.db.select({ gegenstandId: schema.ausleihe.gegenstandId })
          .from(schema.ausleihe).where(eq(schema.ausleihe.id, k.ausleiheId)).get();
        return a?.gegenstandId === filter.gegenstandId;
      })
      .filter(k => !filter?.von || k.zeitstempel >= filter.von)
      .filter(k => !filter?.bis || k.zeitstempel <= filter.bis + 'T23:59:59Z')
      .map(k => ({
        typ: 'kautionsbewegung',
        id: k.id,
        ausleiheId: k.ausleiheId,
        bewegungstyp: k.typ,
        betragEuro: k.betragEuro,
        zeitstempel: k.zeitstempel,
      }));

    const zustandswechsel = this.db.select().from(schema.zustandswechsel).all()
      .filter(z => !filter?.gegenstandId || z.gegenstandId === filter.gegenstandId)
      .filter(z => !filter?.von || z.zeitstempel >= filter.von)
      .filter(z => !filter?.bis || z.zeitstempel <= filter.bis + 'T23:59:59Z')
      .map(z => ({
        typ: 'zustandswechsel',
        id: z.id,
        gegenstandId: z.gegenstandId,
        vonStatus: z.vonStatus,
        nachStatus: z.nachStatus,
        grund: z.grund,
        zeitstempel: z.zeitstempel,
      }));

    return [...kautionen, ...zustandswechsel]
      .sort((a, b) => a.zeitstempel.localeCompare(b.zeitstempel));
  }
}
