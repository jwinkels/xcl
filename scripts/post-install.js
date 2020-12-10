const fs = require('fs-extra');
const homedir = require('os').homedir();
const xclHome = homedir + '/AppData/Roaming/xcl';
const request = require ("request");
var zip = require ('adm-zip');
var os = require ('os');


console.log('CREATING DIRECTORIES AND FILES: ');

if (!fs.existsSync(xclHome)) {
  fs.mkdirSync(xclHome, { recursive: true });
  console.log('...'+xclHome);
}


fs.copySync('./scripts/artifacts/software.yml', xclHome + '/software.yml');
if (!fs.existsSync(xclHome+'/projects.yml')) {
  fs.closeSync(fs.openSync(xclHome + '/projects.yml', 'w'));
  console.log('...'+xclHome+'/projects.yml');
}

if (!fs.existsSync(xclHome+'/local.yml')) {
  fs.closeSync(fs.openSync(xclHome + '/local.yml', 'w'));
  console.log('...'+xclHome+'/local.yml');
}

var options = {};

var setPath = "";

console.log('DOWNLOAD DEPENDENCY ORACLE INSTANT CLIENT: ');

if (os.platform() === 'win32'){
  options.uri = "https://download.oracle.com/otn_software/nt/instantclient/19900/instantclient-basic-windows.x64-19.9.0.0.0dbru.zip";
  
}

if (os.platform() === 'linux'){
  options.uri = "https://download.oracle.com/otn_software/linux/instantclient/199000/instantclient-basic-linux.x64-19.9.0.0.0dbru.zip";
}

options.headers = {};

var filename = xclHome + '/instantclient-basic.zip';

request(options)
    .pipe(
      fs.createWriteStream(filename)
          .on('close', function(){
            var ic = new zip(filename);
            ic.extractAllTo(xclHome+'/');
            let path = ic.getEntries()[0].entryName;
            if (path.toString().includes('/') ){
              path = path.toString().substr(0,path.toString().indexOf('/'));
            }

            if (os.platform() === 'win32'){
              fs.writeFile(xclHome + '/.instantClient','\\\\' + path);
            }else{
              
              fs.writeFile(xclHome + '/.instantClient','/' + path);
            }
            console.log('... ready');
            console.log('You can use XCL now: Type xcl to your commandline and happy coding!');
          })
      );