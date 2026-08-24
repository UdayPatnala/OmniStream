const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const p1 = path.join(ROOT, 'OMNISTREAM_FINAL_BUILD_AGENT.md');
const p2 = path.join(ROOT, 'OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md');

let out = '';
if (fs.existsSync(p1)) {
  out += '=== OMNISTREAM_FINAL_BUILD_AGENT.md ===\n' + fs.readFileSync(p1, 'utf8') + '\n\n';
}
if (fs.existsSync(p2)) {
  out += '=== OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md ===\n' + fs.readFileSync(p2, 'utf8') + '\n\n';
}

fs.writeFileSync(path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'manifesto_rules.txt'), out, 'utf8');
console.log('Saved manifesto_rules.txt');
