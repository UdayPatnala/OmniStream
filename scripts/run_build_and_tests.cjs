const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const logFile = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'build_and_test_results.txt');
let log = '';

function runStep(name, cmd) {
  log += `\n======================================================\n`;
  log += `STEP: ${name}\nCOMMAND: ${cmd}\n`;
  log += `======================================================\n`;
  console.log(`Running: ${name}...`);
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] });
    log += `[SUCCESS]\n${out}\n`;
    console.log(`[SUCCESS] ${name}`);
  } catch (err) {
    log += `[EXIT CODE ${err.status}]\n`;
    if (err.stdout) log += `STDOUT:\n${err.stdout}\n`;
    if (err.stderr) log += `STDERR:\n${err.stderr}\n`;
    console.log(`[FAILED] ${name}`);
  }
}

// 1. TypeScript Type Check
runStep('TypeScript Type Check', 'npx tsc --noEmit');

// 2. Vite Production Build
runStep('Vite Production Build', 'npm run build');

// 3. Vitest Unit & Integration Tests
runStep('Vitest Suite', 'npx vitest run --reporter=verbose');

fs.writeFileSync(logFile, log, 'utf8');
console.log(`Full build & test log written to: ${logFile}`);
