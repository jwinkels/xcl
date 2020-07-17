const fs = require('fs-extra');
const homedir = require('os').homedir();
const xclHome = homedir + '/AppData/Roaming/xcl';
const request = require ("request");
var zip = require ('adm-zip');
var os = require ('os');


if (!fs.existsSync(xclHome)) {
  fs.mkdirSync(xclHome);
}

fs.copySync('./scripts/artifacts/software.yml', xclHome + '/software.yml');
fs.closeSync(fs.openSync(xclHome + '/projects.yml', 'w'));
fs.closeSync(fs.openSync(xclHome + '/local.yml', 'w'));

var options = {};

var setPath = "";

if (os.platform() === 'win32'){
  options.uri = "https://download.oracle.com/otn_software/nt/instantclient/19500/instantclient-basic-windows.x64-19.5.0.0.0dbru.zip";
  
}

if (os.platform() === 'linux'){
  options.uri = "https://download.oracle.com/otn_software/linux/instantclient/19600/instantclient-basic-linux.x64-19.6.0.0.0dbru.zip";
}

options.headers = {};

var filename = xclHome + '/instantclient-basic.zip';

// TODO: Installation Instantclient, optional per YN ausführen
// quasi, wenn irgendas vom InstantClient im Pfad ist....
request(options)
    .pipe(
      fs.createWriteStream(filename)
          .on('close', function(){
            var ic = new zip(filename);
            ic.extractAllTo(xclHome+'/');
            if (os.platform()==='win32'){
              console.log(os.userInfo());
              setPath = 'setx path "%path%";'+xclHome+'/'+ic.getEntries()[0].entryName.toString(); // FIXME: Wird dann eh nicht benutzt, wenn bereits vorhanden, 
                                                                                                   //        da Path von links nach rechts benutzt wird.
            }
          })
      );
