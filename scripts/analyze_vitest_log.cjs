const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const p = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'vitest_full_run.txt');

if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf8');
  console.log('Vitest Log Length:', content.length);
  const lines = content.split('\n');
  const passingSuites = lines.filter(l => l.includes('✓'));
  const failingSuites = lines.filter(l => l.includes('FAIL') || l.includes('×'));
  console.log('Passing suites count:', passingSuites.length);
  console.log('Sample passing suites:\n', passingSuites.slice(0, 15).join('\n'));
  console.log('Failing suites count:', failingSuites.length);
  console.log('Sample failing suites:\n', failingSuites.slice(0, 15).join('\n'));
} else {
  console.log('vitest_full_run.txt not found');
}
