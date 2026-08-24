const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';

function checkFileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

const p1 = path.join(ROOT, 'OMNISTREAM_FINAL_BUILD_AGENT.md');
const manifesto = fs.existsSync(p1) ? fs.readFileSync(p1, 'utf8') : '';

// Let's parse all numbered items in the manifesto
const lines = manifesto.split('\n');
const rules = [];
let currentRule = null;

for (const line of lines) {
  const match = line.match(/^###?\s*(?:Rule\s*)?(\d+)\.?\s*(.*)/i) || line.match(/^\*\*(\d+)\.\s*(.*?)\*\*/);
  if (match) {
    if (currentRule) rules.push(currentRule);
    currentRule = { num: parseInt(match[1]), title: match[2].trim(), lines: [] };
  } else if (currentRule) {
    currentRule.lines.push(line);
  }
}
if (currentRule) rules.push(currentRule);

const evalSummary = {
  total_manifesto_rules_found: rules.length,
  sample_rules: rules.slice(0, 10),
  manifesto_preview: manifesto.slice(0, 3000)
};

fs.writeFileSync(path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'manifesto_parsed.json'), JSON.stringify(evalSummary, null, 2), 'utf8');
console.log(`Parsed ${rules.length} manifesto rules.`);
