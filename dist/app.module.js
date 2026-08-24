"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const health_controller_1 = require("./health/health.controller");
const database_module_1 = require("./db/database.module");
const katalog_module_1 = require("./katalog/katalog.module");
const ausleihe_module_1 = require("./ausleihe/ausleihe.module");
const vormerkung_module_1 = require("./vormerkung/vormerkung.module");
const pruefung_module_1 = require("./pruefung/pruefung.module");
const wartung_module_1 = require("./wartung/wartung.module");
const einweisung_module_1 = require("./einweisung/einweisung.module");
const audit_module_1 = require("./audit/audit.module");
const role_middleware_1 = require("./auth/role.middleware");
const role_guard_1 = require("./auth/role.guard");
const domain_error_filter_1 = require("./errors/domain-error.filter");
const system_date_source_1 = require("./common/system-date-source");
const date_source_token_1 = require("./common/date-source.token");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(role_middleware_1.RoleMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, katalog_module_1.KatalogModule, ausleihe_module_1.AusleiheModule, vormerkung_module_1.VormerkungModule, pruefung_module_1.PruefungModule, wartung_module_1.WartungModule, einweisung_module_1.EinweisungModule, audit_module_1.AuditModule],
        controllers: [health_controller_1.HealthController],
        providers: [
            { provide: core_1.APP_FILTER, useClass: domain_error_filter_1.DomainErrorFilter },
            { provide: core_1.APP_GUARD, useClass: role_guard_1.RoleGuard },
            { provide: date_source_token_1.DATE_SOURCE, useClass: system_date_source_1.SystemDateSource },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map