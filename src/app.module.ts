import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './db/database.module';
import { KatalogModule } from './katalog/katalog.module';
import { AusleiheModule } from './ausleihe/ausleihe.module';
import { RoleMiddleware } from './auth/role.middleware';
import { RoleGuard } from './auth/role.guard';
import { DomainErrorFilter } from './errors/domain-error.filter';
import { SystemDateSource } from './common/system-date-source';
import { DATE_SOURCE } from './common/date-source.token';

@Module({
  imports: [DatabaseModule, KatalogModule, AusleiheModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: DATE_SOURCE, useClass: SystemDateSource },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RoleMiddleware).forRoutes('*');
  }
}
