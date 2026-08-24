const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const agentDir = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1');

const findings = JSON.parse(fs.readFileSync(path.join(agentDir, 'forensic_findings.json'), 'utf8'));
const inspection = JSON.parse(fs.readFileSync(path.join(agentDir, 'code_inspection.json'), 'utf8'));

console.log('--- FINDINGS SUMMARY ---');
findings.forEach((f, idx) => {
  console.log(`\n[${idx + 1}] ${f.section}`);
  console.log(`Analysis: ${f.analysis}`);
});
