const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const agentDir = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1');

function runCommand(cmd, args, outFile) {
  return new Promise((resolve) => {
    console.log(`Starting ${cmd} ${args.join(' ')}...`);
    let output = '';
    const child = spawn(cmd, args, { cwd: ROOT, shell: true });

    child.stdout.on('data', (d) => {
      output += d.toString();
    });
    child.stderr.on('data', (d) => {
      output += d.toString();
    });
    child.on('close', (code) => {
      console.log(`Finished with code ${code}`);
      fs.writeFileSync(outFile, output, 'utf8');
      resolve(code);
    });
  });
}

async function main() {
  console.log('1. Running Vite Build...');
  const buildCode = await runCommand('npx', ['vite', 'build'], path.join(agentDir, 'vite_build_run.txt'));
  console.log(`Vite build completed with code: ${buildCode}`);

  console.log('2. Running Vitest...');
  const testCode = await runCommand('npx', ['vitest', 'run'], path.join(agentDir, 'vitest_full_run.txt'));
  console.log(`Vitest completed with code: ${testCode}`);
}

main();
