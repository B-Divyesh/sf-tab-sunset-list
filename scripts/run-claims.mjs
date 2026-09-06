import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const claims = JSON.parse(await readFile(new URL('../.factory/claims.json', import.meta.url), 'utf8'));
for (const claim of claims) {
  process.stdout.write(`\n[claim:${claim.id}] ${claim.claim}\n$ ${claim.test}\n`);
  const result = spawnSync(claim.test, { cwd: process.cwd(), env: process.env, shell: true, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
process.stdout.write(`\nAll ${claims.length} declared claims passed.\n`);
