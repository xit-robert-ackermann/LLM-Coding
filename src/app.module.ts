import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './db/database.module';
import { RoleMiddleware } from './auth/role.middleware';
import { RoleGuard } from './auth/role.guard';
import { DomainErrorFilter } from './errors/domain-error.filter';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RoleMiddleware).forRoutes('*');
  }
}
