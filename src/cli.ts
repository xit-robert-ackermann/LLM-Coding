import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PruefungService } from './pruefung/pruefung.service';
import { WartungService } from './wartung/wartung.service';
import { EinweisungService } from './einweisung/einweisung.service';
import { DomainError } from './errors/domain-error';
import { Command } from 'commander';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const pruefungService = app.get(PruefungService);
  const wartungService = app.get(WartungService);
  const einweisungService = app.get(EinweisungService);

  const program = new Command();
  program.name('leihgut').description('Leihgut CLI');

  program
    .command('pruefe <ausleiheId>')
    .description('Prüfung durchführen und Ausleihe abschließen')
    .requiredOption('--ergebnis <ergebnis>', 'OK|SCHADEN|VERLOREN|IRREPARABEL')
    .option('--abzug <euro>', 'Kautionsabzug in Euro')
    .option('--notiz <text>', 'Notiz')
    .action(async (ausleiheId: string, opts: any) => {
      try {
        const abzug = opts.abzug !== undefined ? parseInt(opts.abzug, 10) : undefined;
        pruefungService.pruefenAbschliessen({
          ausleiheId,
          ergebnis: opts.ergebnis,
          abzug,
          notiz: opts.notiz,
        });
        console.log(`Prüfung für Ausleihe ${ausleiheId} abgeschlossen.`);
      } catch (e) {
        if (e instanceof DomainError) {
          process.stderr.write(`FEHLER [${e.code}]: ${e.message}\n`);
        } else {
          process.stderr.write(`FEHLER: ${e}\n`);
        }
        process.exit(1);
      }
    });

  program
    .command('warte <inventarnummer>')
    .description('Wartung abschließen')
    .option('--notiz <text>', 'Notiz')
    .action(async (inventarnummer: string, opts: any) => {
      try {
        wartungService.wartungAbschliessen(inventarnummer);
        console.log(`Wartung für Gegenstand ${inventarnummer} abgeschlossen.`);
      } catch (e) {
        if (e instanceof DomainError) {
          process.stderr.write(`FEHLER [${e.code}]: ${e.message}\n`);
        } else {
          process.stderr.write(`FEHLER: ${e}\n`);
        }
        process.exit(1);
      }
    });

  program
    .command('einweise <mitgliedId> <kategorieId>')
    .description('Einweisung dokumentieren')
    .option('--notiz <text>', 'Notiz')
    .action(async (mitgliedId: string, kategorieId: string) => {
      try {
        const result = einweisungService.einweisungAnlegen(mitgliedId, kategorieId);
        if (result.created) {
          console.log(`Einweisung für Mitglied ${mitgliedId} / Kategorie ${kategorieId} angelegt.`);
        } else {
          console.log(`Einweisung bereits vorhanden (kein Duplikat angelegt).`);
        }
      } catch (e) {
        if (e instanceof DomainError) {
          process.stderr.write(`FEHLER [${e.code}]: ${e.message}\n`);
        } else {
          process.stderr.write(`FEHLER: ${e}\n`);
        }
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
  await app.close();
}

main();
