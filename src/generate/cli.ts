#!/usr/bin/env node

const CMD_NAME = 'makedefs';
const USAGE = `Usage: ${CMD_NAME} infile.json outfile.d.ts`;

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { generateDefs } from './generate-defs';

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

const defs = generateDefs(strings as any);
writeFileSync(outFile, defs);
console.log(`Wrote defs to ${outFile}.`);
