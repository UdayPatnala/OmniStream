const { execSync } = require('child_process');

try {
  const out = execSync('npx vitest run src/test/smoke.test.ts', {
    cwd: 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream',
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('SUCCESS:\n', out);
} catch (e) {
  console.log('ERROR:\n', e.stdout || e.message);
}
