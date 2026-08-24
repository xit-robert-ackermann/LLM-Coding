import { DomainError } from './domain-error';
export declare class EingabeUngueltigError extends DomainError {
    readonly code = "EINGABE_UNGUELTIG";
    readonly httpStatus = 400;
}
export declare class RolleUngueltigError extends DomainError {
    readonly code = "ROLLE_UNGUELTIG";
    readonly httpStatus = 403;
}
export declare class MitgliedNichtGefundenError extends DomainError {
    readonly code = "MITGLIED_NICHT_GEFUNDEN";
    readonly httpStatus = 404;
    constructor(id?: string);
}
export declare class GegenstandNichtGefundenError extends DomainError {
    readonly code = "GEGENSTAND_NICHT_GEFUNDEN";
    readonly httpStatus = 404;
    constructor(inv?: string);
}
export declare class KategorieNichtGefundenError extends DomainError {
    readonly code = "KATEGORIE_NICHT_GEFUNDEN";
    readonly httpStatus = 404;
    constructor(id?: string);
}
export declare class AusleiheNichtGefundenError extends DomainError {
    readonly code = "AUSLEIHE_NICHT_GEFUNDEN";
    readonly httpStatus = 404;
    constructor(id?: string);
}
export declare class VormerkungNichtGefundenError extends DomainError {
    readonly code = "VORMERKUNG_NICHT_GEFUNDEN";
    readonly httpStatus = 404;
}
export declare class ReservierungNichtGefundenError extends DomainError {
    readonly code = "RESERVIERUNG_NICHT_GEFUNDEN";
    readonly httpStatus = 404;
}
export declare class GegenstandNichtVerfuegbarError extends DomainError {
    readonly code = "GEGENSTAND_NICHT_VERFUEGBAR";
    readonly httpStatus = 409;
}
export declare class GegenstandWartungsfaelligError extends DomainError {
    readonly code = "GEGENSTAND_WARTUNGSFAELLIG";
    readonly httpStatus = 409;
}
export declare class MitgliedGesperrtError extends DomainError {
    readonly code = "MITGLIED_GESPERRT";
    readonly httpStatus = 409;
}
export declare class MaxAusleihenErreichtError extends DomainError {
    readonly code = "MAX_AUSLEIHEN_ERREICHT";
    readonly httpStatus = 409;
}
export declare class EinweisungFehltError extends DomainError {
    readonly code = "EINWEISUNG_FEHLT";
    readonly httpStatus = 409;
}
export declare class BereitsVerlaengertError extends DomainError {
    readonly code = "BEREITS_VERLAENGERT";
    readonly httpStatus = 409;
}
export declare class AusleiheUeberfaelligError extends DomainError {
    readonly code = "AUSLEIHE_UEBERFAELLIG";
    readonly httpStatus = 409;
}
export declare class VormerkungVorhandenError extends DomainError {
    readonly code = "VORMERKUNG_VORHANDEN";
    readonly httpStatus = 409;
}
export declare class AusleiheNichtOffenError extends DomainError {
    readonly code = "AUSLEIHE_NICHT_OFFEN";
    readonly httpStatus = 409;
}
export declare class GegenstandNichtInPruefungError extends DomainError {
    readonly code = "GEGENSTAND_NICHT_IN_PRUEFUNG";
    readonly httpStatus = 409;
}
export declare class GegenstandNichtWartungsfaelligError extends DomainError {
    readonly code = "GEGENSTAND_NICHT_WARTUNGSFAELLIG";
    readonly httpStatus = 409;
}
export declare class AbzugUebersteigtKautionError extends DomainError {
    readonly code = "ABZUG_UEBERSTEIGT_KAUTION";
    readonly httpStatus = 409;
    constructor(abzug: number, kaution: number);
}
export declare class BereitsVorgemerktError extends DomainError {
    readonly code = "BEREITS_VORGEMERKT";
    readonly httpStatus = 409;
}
export declare class DuplikatError extends DomainError {
    readonly code = "DUPLIKAT";
    readonly httpStatus = 409;
}
