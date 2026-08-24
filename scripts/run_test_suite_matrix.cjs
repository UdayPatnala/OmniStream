const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';

const testDirs = [
  'src/test',
  'src/tests/tier1-features',
  'src/tests/tier2-boundaries',
  'src/tests/tier3-combinations',
  'src/tests/tier4-journeys',
  'src/tests/tier5_adversarial'
];

const results = {};

for (const dir of testDirs) {
  try {
    const out = execSync(`npx vitest run ${dir}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    results[dir] = { status: 'PASS', output: out.slice(-500) };
    console.log(`[PASS] ${dir}`);
  } catch (e) {
    results[dir] = { status: 'FAIL', output: (e.stdout || e.message).slice(-500) };
    console.log(`[FAIL] ${dir}`);
  }
}

fs.writeFileSync(path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'test_matrix_results.json'), JSON.stringify(results, null, 2), 'utf8');
console.log('Saved test_matrix_results.json');
