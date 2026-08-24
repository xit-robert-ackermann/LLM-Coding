"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedDateSource = void 0;
class FixedDateSource {
    constructor(date) {
        this.date = date;
    }
    today() {
        return this.date;
    }
}
exports.FixedDateSource = FixedDateSource;
//# sourceMappingURL=fixed-date-source.js.map