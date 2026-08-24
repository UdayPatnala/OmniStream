const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const logPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'build_and_test_results.txt');
const raw = fs.readFileSync(logPath, 'utf8');

// Let's write the entire raw text into a clean file with lines
const lines = raw.split('\n');
console.log('Total lines:', lines.length);

const out = [];
let capture = false;
for (const line of lines) {
  if (line.includes('STEP:') || line.includes('[SUCCESS]') || line.includes('[FAILED]') || line.includes('EXIT CODE') || line.includes('error') || line.includes('FAIL') || line.includes('Test Files')) {
    out.push(line);
  }
}

fs.writeFileSync(path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'key_log_lines.txt'), out.join('\n'), 'utf8');
console.log('Saved key_log_lines.txt');
