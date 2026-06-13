const fs = require('fs');

['server.ts', 'src/App.tsx'].forEach(f => {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/\\`/g, '`');
  fs.writeFileSync(f, s);
});
console.log('Fixed backticks');
