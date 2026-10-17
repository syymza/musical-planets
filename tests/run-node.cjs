// Run the existing dependency-free checks on any platform with Node.js.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const testFiles = Object.fromEntries(
  ['physics.js', 'app.js', 'audio.js', 'tests/interface.js'].map(name => [name, read(name)])
);
const result = vm.runInNewContext(
  read('tests/gravity.js') + '\nglobalThis.testResult;',
  { testFiles },
  { timeout: 30000, filename: 'tests/gravity.js' }
);
const receipt = JSON.parse(result);
if (receipt.status !== 'PASS') throw new Error('Checks did not pass');
console.log(result);
