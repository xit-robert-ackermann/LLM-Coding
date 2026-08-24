"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const better_sqlite3_1 = require("better-sqlite3");
const better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
const migrator_1 = require("drizzle-orm/better-sqlite3/migrator");
const schema = require("./schema");
const path = require("path");
const fs = require("fs");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    constructor() {
        this.logger = new common_1.Logger(DatabaseService_1.name);
    }
    onModuleInit() {
        const dbPath = process.env.DATABASE_PATH ?? './leihgut.db';
        this.logger.log(`Opening database at ${dbPath}`);
        this.sqlite = new better_sqlite3_1.default(dbPath);
        this.db = (0, better_sqlite3_2.drizzle)(this.sqlite, { schema });
        const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');
        if (fs.existsSync(migrationsFolder)) {
            (0, migrator_1.migrate)(this.db, { migrationsFolder });
        }
        else {
            this.logger.warn('No migrations folder found, skipping migration');
        }
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map