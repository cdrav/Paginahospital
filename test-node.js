const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join(__dirname, 'test-output.txt'), 'Node works! Version: ' + process.version + '\n');
try {
  require('sharp');
  fs.appendFileSync(path.join(__dirname, 'test-output.txt'), 'Sharp: OK\n');
} catch(e) {
  fs.appendFileSync(path.join(__dirname, 'test-output.txt'), 'Sharp: NOT INSTALLED - ' + e.message + '\n');
}
