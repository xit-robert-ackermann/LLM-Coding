"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DomainErrorFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainErrorFilter = void 0;
const common_1 = require("@nestjs/common");
const domain_error_1 = require("./domain-error");
let DomainErrorFilter = DomainErrorFilter_1 = class DomainErrorFilter {
    constructor() {
        this.logger = new common_1.Logger(DomainErrorFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        if (exception instanceof domain_error_1.DomainError) {
            res.status(exception.httpStatus).json({
                fehlercode: exception.code,
                nachricht: exception.message,
                details: {},
            });
            return;
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();
            res.status(status).json(typeof body === 'object' ? body : { fehlercode: 'HTTP_ERROR', nachricht: String(body), details: {} });
            return;
        }
        this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
        res.status(500).json({
            fehlercode: 'INTERNER_FEHLER',
            nachricht: 'Ein unerwarteter Fehler ist aufgetreten.',
            details: {},
        });
    }
};
exports.DomainErrorFilter = DomainErrorFilter;
exports.DomainErrorFilter = DomainErrorFilter = DomainErrorFilter_1 = __decorate([
    (0, common_1.Catch)()
], DomainErrorFilter);
//# sourceMappingURL=domain-error.filter.js.map