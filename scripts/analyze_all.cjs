const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const agentDir = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1');

const manifestoText = fs.readFileSync(path.join(agentDir, 'manifesto_rules.txt'), 'utf8');

console.log('Manifesto preview:\n', manifestoText.slice(0, 1500));
