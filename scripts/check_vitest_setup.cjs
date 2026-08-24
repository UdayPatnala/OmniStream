const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const config = fs.readFileSync(path.join(ROOT, 'vitest.config.ts'), 'utf8');
const setup = fs.readFileSync(path.join(ROOT, 'src/tests/setup.ts'), 'utf8');

console.log('=== vitest.config.ts ===');
console.log(config);

console.log('=== src/tests/setup.ts (lines 150-180) ===');
const lines = setup.split('\n');
console.log(lines.slice(145, 185).join('\n'));
