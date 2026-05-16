
/* eslint-disable no-console */
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
const errors = [];
report.forEach(file => {
  file.messages.forEach(msg => {
    if (msg.severity === 2) {
      errors.push({
        file: file.filePath,
        line: msg.line,
        message: msg.message,
        ruleId: msg.ruleId
      });
    }
  });
});
fs.writeFileSync('errors.json', JSON.stringify(errors, null, 2));
console.log('Errors written to errors.json');
