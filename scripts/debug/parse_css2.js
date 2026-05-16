const fs = require('fs');
const lines = fs.readFileSync('g:\\Project\\eshop_front\\app\\globals.css', 'utf-8').split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let cleanLine = line.replace(/\/\*[\s\S]*?\*\//g, '');
  const opens = (cleanLine.match(/\{/g) || []).length;
  const closes = (cleanLine.match(/\}/g) || []).length;
  if(opens > 0 || closes > 0) {
      let oldDepth = depth;
      depth += opens - closes;
      console.log(`${i+1}: +${opens}/-${closes} | depth -> ${depth} | ${line.trim().substring(0, 40)}`);
  }
}
console.log(`FINAL DEPTH: ${depth}`);
