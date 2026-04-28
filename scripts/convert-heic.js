var fs = require('fs');
var path = require('path');
var ROOT = path.resolve(__dirname, '..');
var DIR = path.join(ROOT, 'documentos', 'rendicion-de-cuentas', '2025', 'Imagenes');
var LOG = path.join(ROOT, 'heic-log.txt');
fs.writeFileSync(LOG, 'START\nDIR=' + DIR + '\nExists=' + fs.existsSync(DIR) + '\n');
var sharp = require('sharp');
var files = fs.readdirSync(DIR).filter(function(f){ return /\.(heic|jpeg)$/i.test(f); });
fs.appendFileSync(LOG, 'Files=' + files.length + '\n' + files.join('\n') + '\n');
(async function(){
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var input = path.join(DIR, file);
    var baseName = file.replace(/\.HEIC$/i, '').replace(/\.JPG\.jpeg$/i, '').replace(/\.jpeg$/i, '');
    var output = path.join(DIR, baseName + '.webp');
    try {
      await sharp(input).rotate().resize({width:1200,withoutEnlargement:true}).webp({quality:80}).toFile(output);
      fs.appendFileSync(LOG, 'OK: ' + file + '\n');
    } catch(e) {
      fs.appendFileSync(LOG, 'ERR: ' + file + ': ' + e.message + '\n');
    }
  }
  fs.appendFileSync(LOG, 'DONE\n');
})();
