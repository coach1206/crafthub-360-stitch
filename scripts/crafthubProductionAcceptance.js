import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';

const structuralOnly = process.argv.includes('--structural');
const baseUrl = process.env.CRAFTHUB_ACCEPTANCE_BASE_URL?.replace(/\/$/, '');

const checks = [
  ['Build production bundle', ['npm', ['run', 'build']]],
  ['SmokeCraft identity live DOM', ['npm', ['run', 'verify:smokecraft-identity-live-buttons']]],
  ['SmokeCraft current frontend architecture', ['npm', ['run', 'verify:smokecraft-current-frontend']]],
  ['SmokeCraft touch response', ['npm', ['run', 'verify:smokecraft-touch-response']]],
  ['SmokeCraft live hotspots', ['npm', ['run', 'verify:smokecraft-live-hotspots']]],
  ['SmokeCraft landing interactions', ['npm', ['run', 'verify:smokecraft-landing-interactions']]],
  ['SmokeCraft flow order', ['npm', ['run', 'verify:smokecraft-flow-order']]],
  ['SmokeCraft live interactions', ['npm', ['run', 'verify:smokecraft-live-interactions']]],
  ['SmokeCraft asset manifest', ['npm', ['run', 'verify:smokecraft-asset-manifest']]],
];

const requiredPaths = [
  'package.json',
  'server',
  'src',
  'scripts',
  'DEPLOYMENT_GUIDE.md',
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

for (const path of requiredPaths) {
  if (!fs.existsSync(path)) fail(`required path missing: ${path}`);
}

for (const [label, [cmd, args]] of checks) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) fail(`${label} returned exit code ${result.status}`);
}

if (structuralOnly) {
  console.log('\nSTRUCTURAL ACCEPTANCE PASS');
  console.log('Production remains BLOCKED until the live acceptance URL is supplied and HTTP workflow probes pass.');
  process.exit(0);
}

if (!baseUrl) {
  console.error('\nBLOCKED: CRAFTHUB_ACCEPTANCE_BASE_URL is required for production acceptance.');
  console.error('Example: CRAFTHUB_ACCEPTANCE_BASE_URL=https://<production-host> npm run acceptance:crafthub:production');
  process.exit(2);
}

const probes = [
  ['root', '/'],
  ['SmokeCraft', '/smokecraft'],
  ['Filler Arrangement', '/smokecraft/filler-arrangement'],
];

for (const [label, path] of probes) {
  const url = `${baseUrl}${path}`;
  console.log(`Probing ${label}: ${url}`);
  let response;
  try {
    response = await fetch(url, { redirect: 'follow' });
  } catch (error) {
    fail(`${label} network probe failed: ${error.message}`);
  }
  if (!response.ok) fail(`${label} returned HTTP ${response.status}`);
}

console.log('\nPRODUCTION ACCEPTANCE TECHNICAL GATE PASS');
console.log('Human owner acceptance must still confirm authenticated save/return/retrieve and Passport/Collections flow with a real account.');
