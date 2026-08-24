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
const role_middleware_1 = require("./auth/role.middleware");
const role_guard_1 = require("./auth/role.guard");
const domain_error_filter_1 = require("./errors/domain-error.filter");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(role_middleware_1.RoleMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [health_controller_1.HealthController],
        providers: [
            { provide: core_1.APP_FILTER, useClass: domain_error_filter_1.DomainErrorFilter },
            { provide: core_1.APP_GUARD, useClass: role_guard_1.RoleGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map