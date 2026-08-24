"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainError = void 0;
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.DomainError = DomainError;
//# sourceMappingURL=domain-error.js.map