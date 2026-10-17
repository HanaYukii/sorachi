#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

try {
  const source = readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8');
  const content = vm.runInNewContext(`${source}\nContent;`, Object.create(null), {
    filename: 'dist/content.js', timeout: 2000,
  });
  const bank = vm.runInNewContext(`${readFileSync(new URL('../dist/drill-bank.js', import.meta.url), 'utf8')}\nDrillBank;`, Object.create(null));
  const diagnostics = [...content.validate(),...bank.validate(content)];
  if (!Array.isArray(diagnostics)) throw new Error('Content.validate() must return diagnostics as an array.');
  if (diagnostics.length) {
    for (const diagnostic of diagnostics) console.error(`FAIL ${diagnostic}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS content: ${Object.keys(content.courses).length} courses, ${content.phrasebook.length} phrasebook categories, ${bank.questions.length} additional drill questions, and introductory lesson`);
  }
} catch (error) {
  console.error(`FAIL content guard: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
