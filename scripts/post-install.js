const fs = require('fs-extra');
const homedir = require('os').homedir();
const xclHome = homedir + '/AppData/Roaming/xcl';
const request = require ("request");
var zip = require ('adm-zip');
var os = require ('os');
var dmg = require ('dmg');

if (!fs.existsSync(xclHome)) {
  console.log('CREATING DIRECTORIES AND FILES: ');
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

if (!fs.existsSync(xclHome + '/.instantClient')){
  var options = {};

  var setPath = "";

  console.log('DOWNLOAD DEPENDENCY ORACLE INSTANT CLIENT: ');
  console.log('for: ', os.platform());

  var filename = "";

  if (os.platform() === 'win32'){
    options.uri = "https://download.oracle.com/otn_software/nt/instantclient/19900/instantclient-basic-windows.x64-19.9.0.0.0dbru.zip";
    filename = xclHome + '/instantclient-basic.zip';
  }

  if (os.platform() === 'linux'){
    options.uri = "https://download.oracle.com/otn_software/linux/instantclient/199000/instantclient-basic-linux.x64-19.9.0.0.0dbru.zip";
    filename = xclHome + '/instantclient-basic.zip';
  }

  if (os.platform() === 'darwin'){
    options.uri = "https://download.oracle.com/otn_software/mac/instantclient/198000/instantclient-basic-macos.x64-19.8.0.0.0dbru.dmg";
    filename = xclHome + '/instantclient-basic.dmg';
  }

  options.headers = {};

  request(options)
      .pipe(
        fs.createWriteStream(filename)
            .on('close', function(){
              if (os.platform()==='win32' || os.platform()==='linux'){
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
              }

              if (os.platform()==='darwin'){
                console.log(filename);
                dmg.mount(filename, function(err, path){
                  fs.mkdirSync(xclHome + '/.instantClient');
                  fs.readdirSync(path).forEach(function(file){
                    fs.copySync(path+'/'+file, xclHome+'/.instantClient/' + file);
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