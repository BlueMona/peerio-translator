#!/usr/bin/env node
const CMD_NAME = 'makepseudo';
const USAGE = `Usage: ${CMD_NAME} infile.json outfile.json`;

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { generatePseudo } from './generate-pseudo';

const [inFile, outFile] = process.argv.slice(2);

if (!inFile || !outFile) {
  console.log(USAGE);
  process.exit(1);
}

if (!existsSync(inFile)) {
  console.error(`Input file "${inFile}" not found.`);
  console.error('---');
  console.error(USAGE);
  process.exit(1);
}

let strings: unknown;
try {
  strings = JSON.parse(readFileSync(inFile).toString());
} catch (e) {
  console.error(`Can't parse input file "${inFile}"!`);
  console.error(e);
  process.exit(1);
}

const pseudo = generatePseudo(strings as any);
writeFileSync(outFile, JSON.stringify(pseudo, undefined, 2));
console.log(`Wrote pseudolocalization to ${outFile}.`);
