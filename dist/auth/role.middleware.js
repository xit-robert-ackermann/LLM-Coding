"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMiddleware = void 0;
const common_1 = require("@nestjs/common");
const VALID_ROLES = ['mitglied', 'thekendienst', 'wart'];
let RoleMiddleware = class RoleMiddleware {
    use(req, res, next) {
        if (req.path === '/health') {
            next();
            return;
        }
        const rolle = req.headers['x-rolle'];
        if (!rolle || !VALID_ROLES.includes(rolle)) {
            res.status(401).json({
                fehlercode: 'ROLLE_UNGUELTIG',
                nachricht: 'X-Rolle Header fehlt oder enthält einen ungültigen Wert.',
                details: {},
            });
            return;
        }
        req.rolle = rolle;
        next();
    }
};
exports.RoleMiddleware = RoleMiddleware;
exports.RoleMiddleware = RoleMiddleware = __decorate([
    (0, common_1.Injectable)()
], RoleMiddleware);
//# sourceMappingURL=role.middleware.js.map