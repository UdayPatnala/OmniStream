const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const jsonPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'test_failure_summary.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log('--- TEST SUMMARY LINES ---');
console.log(data.test_summary_line.join('\n'));

console.log('\n--- FAILURES ---');
data.failures.forEach((f, idx) => {
  console.log(`\nFailure #${idx + 1}:\n${f}\n-----------------------`);
});
