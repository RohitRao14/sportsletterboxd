const b = require('bcryptjs');
const r = require('readline').createInterface({ input: process.stdin, output: process.stdout });
r.question('Password: ', p => {
  b.hash(p, 12).then(h => { console.log('\nHash:', h); r.close(); });
});
