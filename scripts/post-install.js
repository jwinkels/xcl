const fs = require('fs-extra');
const homedir = require('os').homedir();
const xclHome = homedir + '/AppData/Roaming/xcl';
const request = require ("request");
var zip = require ('adm-zip');
var os = require ('os');


if (!fs.existsSync(xclHome)) {
  fs.mkdirSync(xclHome, { recursive: true });
}

fs.copySync('./scripts/artifacts/software.yml', xclHome + '/software.yml');
if (!fs.existsSync(xclHome+'/projects.yml')) {
  fs.closeSync(fs.openSync(xclHome + '/projects.yml', 'w'));
}

if (!fs.existsSync(xclHome+'/local.yml')) {
  fs.closeSync(fs.openSync(xclHome + '/local.yml', 'w'));
}

var options = {};

var setPath = "";

if (os.platform() === 'win32'){
  options.uri = "https://download.oracle.com/otn_software/nt/instantclient/19900/instantclient-basic-windows.x64-19.9.0.0.0dbru.zip";
  
}

if (os.platform() === 'linux'){
  options.uri = "https://download.oracle.com/otn_software/linux/instantclient/211000/instantclient-basic-linux.x64-21.1.0.0.0.zip";
}

options.headers = {};

var filename = xclHome + '/instantclient-basic.zip';

request(options)
    .pipe(
      fs.createWriteStream(filename)
          .on('close', function(){
            var ic = new zip(filename);
            ic.extractAllTo(xclHome+'/');
            if (os.platform() === 'win32'){
              fs.writeFile(xclHome + '/.instantClient','\\\\'+ic.getEntries()[0].entryName);
            }else{
              fs.writeFile(xclHome + '/.instantClient','/'+ic.getEntries()[0].entryName);
            }
          })
      );