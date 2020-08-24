import * as kleur from 'kleur';
import { CrawlConfig, CrawledRelease } from './models';

export function logError(message: string) {
  console.log(kleur.red(message));
}

const maxWidth = 40;
const headingIntend = 2;
const stepIntend = 3;
const headingSpacer = '-';

export function printHeadline(message: string) {
  const heading = [
    getString(headingIntend, headingSpacer),
    ` ${message} `,
    getString(maxWidth - headingIntend + message.length + 2, headingSpacer),
  ].join('');
  console.log(kleur.gray(heading));
}

export function printFooterLine(): void {
  console.log('');
  console.log(getString(maxWidth, headingSpacer));
}

export function printProgress(message = '⏰') {
  const heading = [getString(stepIntend, headingSpacer), ` ${message}`].join(
    ''
  );
  console.log(kleur.gray(heading));
}

function getString(length, char): string {
  return Array(length).fill(char).join('');
}

export interface ProcessFeedback {
  printStart?(config?: CrawlConfig, rawRelease?: CrawledRelease): void;
  printEnd?(config?: CrawlConfig, rawRelease?: CrawledRelease): void;
}
