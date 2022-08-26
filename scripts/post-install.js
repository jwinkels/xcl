const fs = require('fs-extra');
const homedir = require('os').homedir();
const xclHome = homedir + '/AppData/Roaming/xcl';
//const request = require ("request");
const got = require('got');
var zip = require ('adm-zip');
var os = require ('os');
var dmg = require ('dmg');

const MAC_VERSION  = '19.8.0.0.0';
const UNIX_VERSION = '21.6.0.0.0';
const WIN_VERSION  = '21.6.0.0.0';

const MAC_VERSION_STRING  = `macos.x64-${MAC_VERSION}dbru.dmg`;
const UNIX_VERSION_STRING = `linux.x64-${UNIX_VERSION}dbru.zip`;
const WIN_VERSION_STRING  = `windows.x64-${WIN_VERSION}dbru.zip`;

const MAC_URL = `https://download.oracle.com/otn_software/mac/instantclient/${MAC_VERSION.replaceAll('.','')}/instantclient-basic-`;
const WIN_URL = `https://download.oracle.com/otn_software/nt/instantclient/${WIN_VERSION.replaceAll('.','')}/instantclient-basic-`;
const UNIX_URL = `https://download.oracle.com/otn_software/linux/instantclient/${UNIX_VERSION.replaceAll('.','')}/instantclient-basic-`;

if (!fs.existsSync(xclHome)) {
  console.log('CREATING DIRECTORIES AND FILES: ');
  fs.mkdirSync(xclHome, { recursive: true });
  console.log('...' + xclHome);
}

fs.copySync('./scripts/artifacts/software.yml', xclHome + '/software.yml');
if (!fs.existsSync(xclHome + '/projects.yml')) {
  fs.closeSync(fs.openSync(xclHome + '/projects.yml', 'w'));
  console.log('...' + xclHome + '/projects.yml');
}

if (!fs.existsSync(xclHome + '/local.yml')) {
  fs.closeSync(fs.openSync(xclHome + '/local.yml', 'w'));
  console.log('...' + xclHome + '/local.yml');
}

if (!fs.existsSync(xclHome + '/.instantClient')){
  var options = {};

  console.log('DOWNLOAD DEPENDENCY ORACLE INSTANT CLIENT: ');
  console.log('for: ', os.platform());

  var filename = "";

  if (os.platform() === 'win32'){
    options.url = `${WIN_URL}${WIN_VERSION_STRING}`;
    filename = xclHome + '/instantclient-basic.zip';
  }

  if (os.platform() === 'linux'){
    options.url = `${UNIX_URL}${UNIX_VERSION_STRING}`;
    filename = xclHome + '/instantclient-basic.zip';
  }

  if (os.platform() === 'darwin'){
    options.url = `${MAC_URL}${MAC_VERSION_STRING}`;
    filename = xclHome + '/instantclient-basic.dmg';
  }

  options.headers = {};
  got.stream(options)
      .pipe(
        fs.createWriteStream(filename)
            .on('close', function(){
              if (os.platform()==='win32' || os.platform()==='linux'){
                var ic = new zip(filename);
                ic.extractAllTo(xclHome + '/');

                let path = ic.getEntries()[0].entryName;

                if (path.toString().includes('/') ){
                  path = path.toString().substring(0, path.toString().indexOf('/'));
                }

                if (os.platform() === 'win32'){
                  fs.writeFile(xclHome + '/.instantClient','\\\\' + path);
                }else{

                  fs.writeFile(xclHome + '/.instantClient','/' + path);
                }
              }

              if (os.platform()==='darwin'){
                dmg.mount(filename, function(err, path){
                  fs.mkdirSync(`${xclHome}/.instantClient`);
                  fs.readdirSync(path).forEach(function(file){
                    fs.copySync(`${path}/${file}`, `${xclHome}/.instantClient/${file}`);
                  });

                  dmg.unmount(path, function(err){
                    if(err){
                      console.log(err);
                    }
                  });
                });
              }

              console.log('... ready');
              console.log('You can use XCL now: Type xcl to your commandline and happy coding!');
            })
        );
}