#!/usr/bin/env node

/**
 * CLI to update the package.json version.
 * Usage: npm run version:set -- 1.2.3
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error('❌ Missing version. Usage: npm run version:set -- 1.2.3');
  process.exit(1);
}

if (!semverPattern.test(nextVersion)) {
  console.error(`❌ Invalid version "${nextVersion}". Expected semver (e.g., 1.2.3 or 1.2.3-beta).`);
  process.exit(1);
}

let pkg;
try {
  const raw = fs.readFileSync(pkgPath, 'utf8');
  pkg = JSON.parse(raw);
} catch (err) {
  console.error(`❌ Unable to read package.json: ${err.message}`);
  process.exit(1);
}

pkg.version = nextVersion;

try {
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`✅ package.json version set to ${nextVersion}`);
} catch (err) {
  console.error(`❌ Unable to write package.json: ${err.message}`);
  process.exit(1);
}
