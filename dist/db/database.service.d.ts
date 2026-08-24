import { OnModuleInit } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
export declare class DatabaseService implements OnModuleInit {
    private readonly logger;
    db: BetterSQLite3Database<typeof schema>;
    private sqlite;
    onModuleInit(): void;
}
