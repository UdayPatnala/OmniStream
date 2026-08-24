const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const agentDir = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1');

const manifestoText = fs.readFileSync(path.join(ROOT, 'OMNISTREAM_FINAL_BUILD_AGENT.md'), 'utf8');
const intelText = fs.readFileSync(path.join(ROOT, 'OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md'), 'utf8');

// Parse rules from manifestoText
const lines = manifestoText.split('\n');
const items = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.match(/^(\d+)\.\s+/)) {
    items.push(line);
  } else if (line.match(/^###?\s*Rule\s*(\d+)/i)) {
    items.push(line);
  }
}

const result = {
  manifesto_item_count: items.length,
  manifesto_items: items,
  intel_sections: intelText.split('\n').filter(l => l.startsWith('## ')).map(l => l.replace('## ', ''))
};

fs.writeFileSync(path.join(agentDir, 'manifesto_analysis.json'), JSON.stringify(result, null, 2), 'utf8');
console.log('Manifesto analysis complete:', result.manifesto_item_count, 'rules found');
