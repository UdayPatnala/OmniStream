const fs = require('fs');
const path = require('path');
const log = fs.readFileSync(path.join('d:\\PROJECT\\AROH Open Source\\Products\\OmniStream\\.agents\\teamwork_preview_auditor_1\\build_and_test_results.txt'), 'utf8');

const keyLines = fs.readFileSync(path.join('d:\\PROJECT\\AROH Open Source\\Products\\OmniStream\\.agents\\teamwork_preview_auditor_1\\key_log_lines.txt'), 'utf8');

console.log('--- KEY LOG LINES ---');
console.log(keyLines);
