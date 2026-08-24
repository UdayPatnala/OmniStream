const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const logPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'build_and_test_results.txt');

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  console.log('=== BUILD & TEST RESULTS ===');
  console.log(content);
} else {
  console.log('Log file not found');
}
