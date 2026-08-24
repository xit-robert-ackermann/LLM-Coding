import { DomainError } from './domain-error';

export class EingabeUngueltigError extends DomainError {
  readonly code = 'EINGABE_UNGUELTIG';
  readonly httpStatus = 400;
}
export class RolleUngueltigError extends DomainError {
  readonly code = 'ROLLE_UNGUELTIG';
  readonly httpStatus = 403;
}
export class MitgliedNichtGefundenError extends DomainError {
  readonly code = 'MITGLIED_NICHT_GEFUNDEN';
  readonly httpStatus = 404;
  constructor(id?: string) { super(id ? `Mitglied '${id}' nicht gefunden.` : 'Mitglied nicht gefunden.'); }
}
export class GegenstandNichtGefundenError extends DomainError {
  readonly code = 'GEGENSTAND_NICHT_GEFUNDEN';
  readonly httpStatus = 404;
  constructor(inv?: string) { super(inv ? `Gegenstand '${inv}' nicht gefunden.` : 'Gegenstand nicht gefunden.'); }
}
export class KategorieNichtGefundenError extends DomainError {
  readonly code = 'KATEGORIE_NICHT_GEFUNDEN';
  readonly httpStatus = 404;
  constructor(id?: string) { super(id ? `Kategorie '${id}' nicht gefunden.` : 'Kategorie nicht gefunden.'); }
}
export class AusleiheNichtGefundenError extends DomainError {
  readonly code = 'AUSLEIHE_NICHT_GEFUNDEN';
  readonly httpStatus = 404;
  constructor(id?: string) { super(id ? `Ausleihe '${id}' nicht gefunden.` : 'Ausleihe nicht gefunden.'); }
}
export class VormerkungNichtGefundenError extends DomainError {
  readonly code = 'VORMERKUNG_NICHT_GEFUNDEN';
  readonly httpStatus = 404;
}
export class ReservierungNichtGefundenError extends DomainError {
  readonly code = 'RESERVIERUNG_NICHT_GEFUNDEN';
  readonly httpStatus = 404;
}
export class GegenstandNichtVerfuegbarError extends DomainError {
  readonly code = 'GEGENSTAND_NICHT_VERFUEGBAR';
  readonly httpStatus = 409;
}
export class GegenstandWartungsfaelligError extends DomainError {
  readonly code = 'GEGENSTAND_WARTUNGSFAELLIG';
  readonly httpStatus = 409;
}
export class MitgliedGesperrtError extends DomainError {
  readonly code = 'MITGLIED_GESPERRT';
  readonly httpStatus = 409;
}
export class MaxAusleihenErreichtError extends DomainError {
  readonly code = 'MAX_AUSLEIHEN_ERREICHT';
  readonly httpStatus = 409;
}
export class EinweisungFehltError extends DomainError {
  readonly code = 'EINWEISUNG_FEHLT';
  readonly httpStatus = 409;
}
export class BereitsVerlaengertError extends DomainError {
  readonly code = 'BEREITS_VERLAENGERT';
  readonly httpStatus = 409;
}
export class AusleiheUeberfaelligError extends DomainError {
  readonly code = 'AUSLEIHE_UEBERFAELLIG';
  readonly httpStatus = 409;
}
export class VormerkungVorhandenError extends DomainError {
  readonly code = 'VORMERKUNG_VORHANDEN';
  readonly httpStatus = 409;
}
export class AusleiheNichtOffenError extends DomainError {
  readonly code = 'AUSLEIHE_NICHT_OFFEN';
  readonly httpStatus = 409;
}
export class GegenstandNichtInPruefungError extends DomainError {
  readonly code = 'GEGENSTAND_NICHT_IN_PRUEFUNG';
  readonly httpStatus = 409;
}
export class GegenstandNichtWartungsfaelligError extends DomainError {
  readonly code = 'GEGENSTAND_NICHT_WARTUNGSFAELLIG';
  readonly httpStatus = 409;
}
export class AbzugUebersteigtKautionError extends DomainError {
  readonly code = 'ABZUG_UEBERSTEIGT_KAUTION';
  readonly httpStatus = 409;
  constructor(abzug: number, kaution: number) {
    super(`Abzug (${abzug} EUR) übersteigt hinterlegte Kaution (${kaution} EUR).`);
  }
}
export class BereitsVorgemerktError extends DomainError {
  readonly code = 'BEREITS_VORGEMERKT';
  readonly httpStatus = 409;
}
export class DuplikatError extends DomainError {
  readonly code = 'DUPLIKAT';
  readonly httpStatus = 409;
}
