const fs = require('fs');
const path = require('path');
const setup = fs.readFileSync('d:\\PROJECT\\AROH Open Source\\Products\\OmniStream\\src\\tests\\setup.ts', 'utf8');

console.log('--- src/tests/setup.ts Top 50 lines ---');
console.log(setup.split('\n').slice(0, 50).join('\n'));
