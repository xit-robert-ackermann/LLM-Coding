import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);
  db!: BetterSQLite3Database<typeof schema>;
  private sqlite!: Database.Database;

  onModuleInit() {
    const dbPath = process.env.DATABASE_PATH ?? './leihgut.db';
    this.logger.log(`Opening database at ${dbPath}`);
    this.sqlite = new Database(dbPath);
    this.db = drizzle(this.sqlite, { schema });
    const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');
    if (fs.existsSync(migrationsFolder)) {
      migrate(this.db, { migrationsFolder });
    } else {
      this.logger.warn('No migrations folder found, skipping migration');
    }
  }
}
