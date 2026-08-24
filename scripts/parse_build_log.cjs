const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const logPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'build_and_test_results.txt');
const content = fs.readFileSync(logPath, 'utf8');

// Let's write a parsed summary
const summaryPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'build_summary.json');

const sections = content.split('======================================================');
const summary = {
  raw_log_length: content.length,
  snippets: sections.map(s => s.slice(0, 500))
};

fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
console.log('Saved build_summary.json');
