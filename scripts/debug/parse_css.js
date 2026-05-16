const fs = require('fs');
const code = fs.readFileSync('g:\\Project\\eshop_front\\app\\globals.css', 'utf-8');

let inComment = false;
let depth = 0;
let currentLine = 1;
for (let i = 0; i < code.length; i++) {
    if (!inComment && code[i] === '/' && code[i + 1] === '*') {
        inComment = true;
        i++;
        continue;
    }
    if (inComment && code[i] === '*' && code[i + 1] === '/') {
        inComment = false;
        i++;
        continue;
    }
    if (code[i] === '\\n') {
        currentLine++;
        continue;
    }
    if (!inComment) {
        if (code[i] === '{') {
            console.log(`${String(currentLine).padStart(3, ' ')}: ${'  '.repeat(depth)} {`);
            depth++;
        } else if (code[i] === '}') {
            depth--;
            if (depth < 0) {
                console.log(`${String(currentLine).padStart(3, ' ')}: [ERROR] NEGATIVE DEPTH }`);
                depth = 0;
            } else {
                console.log(`${String(currentLine).padStart(3, ' ')}: ${'  '.repeat(depth)} }`);
            }
        }
    }
}
console.log(`FINAL DEPTH: ${depth}`);
