"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplikatError = exports.BereitsVorgemerktError = exports.AbzugUebersteigtKautionError = exports.GegenstandNichtWartungsfaelligError = exports.GegenstandNichtInPruefungError = exports.AusleiheNichtOffenError = exports.VormerkungVorhandenError = exports.AusleiheUeberfaelligError = exports.BereitsVerlaengertError = exports.EinweisungFehltError = exports.MaxAusleihenErreichtError = exports.MitgliedGesperrtError = exports.GegenstandWartungsfaelligError = exports.GegenstandNichtVerfuegbarError = exports.ReservierungNichtGefundenError = exports.VormerkungNichtGefundenError = exports.AusleiheNichtGefundenError = exports.KategorieNichtGefundenError = exports.GegenstandNichtGefundenError = exports.MitgliedNichtGefundenError = exports.RolleUngueltigError = exports.EingabeUngueltigError = void 0;
const domain_error_1 = require("./domain-error");
class EingabeUngueltigError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'EINGABE_UNGUELTIG';
        this.httpStatus = 400;
    }
}
exports.EingabeUngueltigError = EingabeUngueltigError;
class RolleUngueltigError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'ROLLE_UNGUELTIG';
        this.httpStatus = 403;
    }
}
exports.RolleUngueltigError = RolleUngueltigError;
class MitgliedNichtGefundenError extends domain_error_1.DomainError {
    constructor(id) {
        super(id ? `Mitglied '${id}' nicht gefunden.` : 'Mitglied nicht gefunden.');
        this.code = 'MITGLIED_NICHT_GEFUNDEN';
        this.httpStatus = 404;
    }
}
exports.MitgliedNichtGefundenError = MitgliedNichtGefundenError;
class GegenstandNichtGefundenError extends domain_error_1.DomainError {
    constructor(inv) {
        super(inv ? `Gegenstand '${inv}' nicht gefunden.` : 'Gegenstand nicht gefunden.');
        this.code = 'GEGENSTAND_NICHT_GEFUNDEN';
        this.httpStatus = 404;
    }
}
exports.GegenstandNichtGefundenError = GegenstandNichtGefundenError;
class KategorieNichtGefundenError extends domain_error_1.DomainError {
    constructor(id) {
        super(id ? `Kategorie '${id}' nicht gefunden.` : 'Kategorie nicht gefunden.');
        this.code = 'KATEGORIE_NICHT_GEFUNDEN';
        this.httpStatus = 404;
    }
}
exports.KategorieNichtGefundenError = KategorieNichtGefundenError;
class AusleiheNichtGefundenError extends domain_error_1.DomainError {
    constructor(id) {
        super(id ? `Ausleihe '${id}' nicht gefunden.` : 'Ausleihe nicht gefunden.');
        this.code = 'AUSLEIHE_NICHT_GEFUNDEN';
        this.httpStatus = 404;
    }
}
exports.AusleiheNichtGefundenError = AusleiheNichtGefundenError;
class VormerkungNichtGefundenError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'VORMERKUNG_NICHT_GEFUNDEN';
        this.httpStatus = 404;
    }
}
exports.VormerkungNichtGefundenError = VormerkungNichtGefundenError;
class ReservierungNichtGefundenError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'RESERVIERUNG_NICHT_GEFUNDEN';
        this.httpStatus = 404;
    }
}
exports.ReservierungNichtGefundenError = ReservierungNichtGefundenError;
class GegenstandNichtVerfuegbarError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'GEGENSTAND_NICHT_VERFUEGBAR';
        this.httpStatus = 409;
    }
}
exports.GegenstandNichtVerfuegbarError = GegenstandNichtVerfuegbarError;
class GegenstandWartungsfaelligError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'GEGENSTAND_WARTUNGSFAELLIG';
        this.httpStatus = 409;
    }
}
exports.GegenstandWartungsfaelligError = GegenstandWartungsfaelligError;
class MitgliedGesperrtError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'MITGLIED_GESPERRT';
        this.httpStatus = 409;
    }
}
exports.MitgliedGesperrtError = MitgliedGesperrtError;
class MaxAusleihenErreichtError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'MAX_AUSLEIHEN_ERREICHT';
        this.httpStatus = 409;
    }
}
exports.MaxAusleihenErreichtError = MaxAusleihenErreichtError;
class EinweisungFehltError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'EINWEISUNG_FEHLT';
        this.httpStatus = 409;
    }
}
exports.EinweisungFehltError = EinweisungFehltError;
class BereitsVerlaengertError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'BEREITS_VERLAENGERT';
        this.httpStatus = 409;
    }
}
exports.BereitsVerlaengertError = BereitsVerlaengertError;
class AusleiheUeberfaelligError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'AUSLEIHE_UEBERFAELLIG';
        this.httpStatus = 409;
    }
}
exports.AusleiheUeberfaelligError = AusleiheUeberfaelligError;
class VormerkungVorhandenError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'VORMERKUNG_VORHANDEN';
        this.httpStatus = 409;
    }
}
exports.VormerkungVorhandenError = VormerkungVorhandenError;
class AusleiheNichtOffenError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'AUSLEIHE_NICHT_OFFEN';
        this.httpStatus = 409;
    }
}
exports.AusleiheNichtOffenError = AusleiheNichtOffenError;
class GegenstandNichtInPruefungError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'GEGENSTAND_NICHT_IN_PRUEFUNG';
        this.httpStatus = 409;
    }
}
exports.GegenstandNichtInPruefungError = GegenstandNichtInPruefungError;
class GegenstandNichtWartungsfaelligError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'GEGENSTAND_NICHT_WARTUNGSFAELLIG';
        this.httpStatus = 409;
    }
}
exports.GegenstandNichtWartungsfaelligError = GegenstandNichtWartungsfaelligError;
class AbzugUebersteigtKautionError extends domain_error_1.DomainError {
    constructor(abzug, kaution) {
        super(`Abzug (${abzug} EUR) übersteigt hinterlegte Kaution (${kaution} EUR).`);
        this.code = 'ABZUG_UEBERSTEIGT_KAUTION';
        this.httpStatus = 409;
    }
}
exports.AbzugUebersteigtKautionError = AbzugUebersteigtKautionError;
class BereitsVorgemerktError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'BEREITS_VORGEMERKT';
        this.httpStatus = 409;
    }
}
exports.BereitsVorgemerktError = BereitsVorgemerktError;
class DuplikatError extends domain_error_1.DomainError {
    constructor() {
        super(...arguments);
        this.code = 'DUPLIKAT';
        this.httpStatus = 409;
    }
}
exports.DuplikatError = DuplikatError;
//# sourceMappingURL=domain-errors.js.map