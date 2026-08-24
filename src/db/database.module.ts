import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

export const DB_TOKEN = 'DRIZZLE_DB';

@Global()
@Module({
  providers: [DatabaseService, { provide: DB_TOKEN, useFactory: (s: DatabaseService) => s.db, inject: [DatabaseService] }],
  exports: [DatabaseService, DB_TOKEN],
})
export class DatabaseModule {}
