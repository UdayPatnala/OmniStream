const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const testLogPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'vitest_full_run.txt');
const content = fs.readFileSync(testLogPath, 'utf8');

const lines = content.split('\n');
const failedLines = [];
let capture = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('FAIL') || line.includes('AssertionError') || line.includes('Error:') || line.includes('×') || line.includes('failed')) {
    failedLines.push(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 10)).join('\n'));
  }
}

const summary = {
  total_lines: lines.length,
  test_summary_line: lines.filter(l => l.includes('Test Files') || l.includes('Tests') || l.includes('Duration')),
  failures: failedLines
};

fs.writeFileSync(path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'test_failure_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
console.log('Saved test_failure_summary.json');
