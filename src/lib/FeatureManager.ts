//Imports
import yaml from "yaml";
import * as fs from "fs-extra";
import * as os from "os";
import chalk from 'chalk'
import { GithubFeature } from './GithubFeature';
import { Feature, FeatureType } from './Feature';
import { ProjectManager } from './ProjectManager';
import { ProjectFeature } from './ProjectFeature';
import { GithubCredentials } from './GithubCredentials';
import { DBHelper, IConnectionProperties } from './DBHelper';
import  { deliveryFactory }  from './DeliveryFactory';
import { DeliveryMethod } from './DeliveryMethod';
import {Project} from './Project';
import { Environment } from './Environment';
import { Operation } from './Operation';
import { Utils } from './Utils';
import { Logger } from "./Logger";
import inquirer from "inquirer";
import { Schema } from "./Schema";
import AdmZip from "adm-zip";
import  Table  from 'cli-table3';
import got from 'got';

export class FeatureManager{
    public static softwareYMLfile: string = "software.yml";

    private static manager: FeatureManager;
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";
    private static softwareYaml: yaml.Document;
    private static softwareJson: any;
    private static features: Map<string, GithubFeature|CustomFeature>;

    private constructor(){
        FeatureManager.softwareYaml = yaml.parseDocument(fs.readFileSync(FeatureManager.xclHome + "/" 
                                                            + FeatureManager.softwareYMLfile).toString());


        // convert to json of create an empty definition
        FeatureManager.softwareJson = FeatureManager.softwareYaml.toJSON();
        FeatureManager.features = new Map();

        Object.keys(FeatureManager.softwareJson.software).forEach(function(softwareName){
          let softwareJSON = FeatureManager.softwareJson.software[softwareName];
          let featureType:FeatureType;
         
          if (softwareJSON.deploy){
            featureType = FeatureType.DEPLOY;
          }else{
            featureType = FeatureType.DB;
          }
            
          FeatureManager.features.set(softwareName, new GithubFeature({ name: softwareName, 
                                                                  owner: softwareJSON.owner, 
                                                                  repo: softwareJSON.repo, 
                                                                  gitAttribute: softwareJSON.call,
                                                                  type: featureType
                                                                })
                                                              );
        });
        // what else belongs to FM?
    }

    static getInstance() {
        if (!FeatureManager.manager ) {
          FeatureManager.manager = new FeatureManager();
        }
        return FeatureManager.manager;
      }

    public listFeatures(type:string) {
        if (ProjectManager.getInstance().getProjectNameByPath(process.cwd())=="all"){
          const table = new Table({
            head: [        
              chalk.blueBright('name'),
              chalk.blueBright('github-repository'),
              chalk.blueBright('owner'),
              chalk.blueBright('type')
            ]
          });
          let feature:Feature;

          for(feature of FeatureManager.features.values()){
            if( feature instanceof GithubFeature){
              if (feature.getType()===type || type==="all"){
                table.push([ feature.getName(), feature.getRepo(), feature.getOwner(), feature.getType() ]);
              }
            }
          }
          console.log(table.toString());
        }else{
          //ab hier neues Verhalten des List-befehls
          let p:Project = ProjectManager.getInstance().getProject(ProjectManager.getInstance().getProjectNameByPath(process.cwd()));                                                    
          const table = new Table({
            head: [        
              chalk.blueBright('name'),
              chalk.blueBright('github-repository'),
              chalk.blueBright('owner'),
              chalk.blueBright('type'),
              chalk.blueBright('status'),
              chalk.blueBright('')
            ]
          });
          let feature:Feature;

          for(feature of FeatureManager.features.values()){
            if(feature instanceof ProjectFeature){  
              if (feature.getType()===type || type==="all"){
                if(p.getFeatures().has(feature.getName())){
                    table.push([ feature.getName(), feature.getRepo(), feature.getOwner(), feature.getType(),'added ',  (p.getFeatures().get(feature.getName()) as ProjectFeature).getStatus()]);
                }else{
                  table.push([ feature.getName(), feature.getRepo(), feature.getOwner(), feature.getType(),'not added','' ]);
                }
              }
            }else if (feature instanceof CustomFeature){
              if (feature.getType()===type || type==="all"){
                table.push([ feature.getName(), '', '', feature.getType(),'added ',  (p.getFeatures().get(feature.getName()) as ProjectFeature).getStatus()]);
              }
            }
          }
          console.log(table.toString());
          //Bis hier neues Verhalten
        }
        
      }

      public async getFeatureReleases(name:string):Promise<string[]>{
        
        return new Promise((resolve, reject)=>{          
          if(FeatureManager.features.has(name.toLowerCase())){
              resolve((FeatureManager.features.get(name.toLowerCase()) ! as GithubFeature).getReleaseInformation());
          }else{
            throw Error('Unknown Feature: '+name+' Try: xcl feature:list');
          }
        });
      }

      public addFeatureToProject(featureName:string, version:string, projectName:string, username: string, password: string, custom:boolean=false, customFeature:{zip:string, installScript: string}|undefined = undefined):Promise<boolean>{
        return new Promise((resolve,reject)=>{
          let pManager:ProjectManager = ProjectManager.getInstance();
          let project:Project         = pManager.getProject(projectName);
          let added:any; 
          
          if (!custom){
            added = project.addFeature( (this.getProjectFeature(featureName, version, username, password) ! ));
            if (added){
              this.downloadFeature(project.getFeatures().get(featureName) as ProjectFeature, projectName).then(()=>resolve(true));
            }else{
              resolve(false);
            }
          }else{
            if (customFeature){
              added = project.addFeature(new CustomFeature({name: featureName, version: version, username: username, password: password, installed: false, zipLocation: customFeature.zip, installScript: customFeature.installScript}));
            }
          }
          
        });
      }

      private downloadFeature(feature:ProjectFeature, projectName:string):Promise<void>{
        let pManager : ProjectManager = ProjectManager.getInstance();
        let project  : Project        = pManager.getProject(projectName);
        return new Promise((resolve, reject) => {
          
          var filename = project.getPath() + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation() + '.zip';
          
          if(feature.getType() !== "CUSTOM"){
            feature.getDownloadUrl().then(function(url){
              var options = {
                uri: "",
                headers: {}
              };
              
              options.uri = url;

              if (GithubCredentials.get()){
                  options.headers = {
                      'User-Agent': 'xcl',
                      'Authorization': 'token ' + GithubCredentials.get()
                  };
              }else{
                options.headers = {
                  'User-Agent': 'xcl'
                }
              }

              if(!fs.pathExistsSync(pManager.getProject(projectName).getPath() + '/dependencies')){
                  fs.mkdirSync(pManager.getProject(projectName).getPath() + '/dependencies');
              }

              got.stream(options).pipe(
                fs.createWriteStream(filename)
                .on('close', function(){
                  resolve();
                })
              );

            });
          });
      }

      public listProjectFeatures(projectName:string, type:string){
        const table = new Table({
          head: [        
            chalk.blueBright('name'),
            chalk.blueBright('version'),
            chalk.blueBright('type'),
            chalk.blueBright('status')
            
          ]
        });

        let feature:Feature;
        let project:Project = ProjectManager.getInstance().getProject(projectName);
        for(feature of project.getFeatures().values()){
          if (feature.getType()===type || type==="all"){
            if (feature instanceof ProjectFeature && feature.getType()===FeatureType.DEPLOY){
              table.push([
                feature.getName(), 
                feature.getVersion(),
                feature.getType(),
                feature.getStatus()
              ]);
            }else{
              if(feature instanceof ProjectFeature){
                table.push([
                  feature.getName(), 
                  feature.getVersion(),
                  feature.getType(),
                  (project.getStatus().getDependencyStatus(feature)?chalk.green('installed'):chalk.red('uninstalled'))
                ]);
              }else if(feature instanceof CustomFeature){
                table.push([
                  feature.getName(), 
                  feature.getVersion(),
                  feature.getType(),
                  (project.getStatus().getDependencyStatus(feature)?chalk.green('installed'):chalk.red('uninstalled'))
                ]);
              }
            }
          }
        }
      
        console.log('Showing Features for Project: '+projectName);
        console.log(table.toString());
      }

      public getProjectFeature(featureName:string, version:string, username:string, password:string, installed:boolean=false):ProjectFeature|undefined{
        let feature:ProjectFeature|undefined;
        if( FeatureManager.features.has(featureName.toLowerCase()) ){
          if (FeatureManager.features.get(featureName.toLowerCase()) !== undefined ){
            feature = new ProjectFeature({parent: (FeatureManager.features.get(featureName.toLowerCase()) ! as GithubFeature),
                                              version: version,
                                              username: username,
                                              password: password,
                                              installed: installed
                                          });
            if (feature === undefined){                                            
              throw Error("Feature could not be found!");
            }
          }
        }else{
          throw Error ("Unkown feature!");
        }
        return feature;
      }

      public getCustomProjectFeature(featureName:string, version:string, username:string, password:string, customFeature:{zip: string, installScript: string}, installed:boolean=false):CustomFeature{
        let feature:CustomFeature = new CustomFeature({
                                          name          : featureName, 
                                          version       : version, 
                                          installScript : customFeature.installScript, 
                                          zipLocation   : customFeature.zip, 
                                          username      : username, 
                                          password      : password, 
                                          installed     : installed
                                      });
        return feature;
      }

      public async installAllProjectFeatures(projectName:string, connection:string, syspw:string, forceInstall:boolean){
        for (const feature of ProjectManager.getInstance().getProject(projectName).getFeaturesOfType('DB').values()){
          if(feature.isInstalled() && forceInstall){
            await FeatureManager.updateFeatureVersion(feature.getName(), feature.getVersion(), projectName, connection, syspw);
          }else{
            FeatureManager.getInstance().installProjectFeature(feature.getName(), connection, syspw, projectName);
          }
        }
      }

      public installProjectFeature(featureName:string, connection:string, syspw:string, projectName:string):Promise<void>{
          return new Promise((resolve, reject)=>{
            var connectionWithUser="";
            
            interface Script{
              path: string,
              sys: boolean,
              xcl: boolean,
              arguments: any,
              always: boolean
            }

            var projectPath = ProjectManager.getInstance().getProject(projectName).getPath();
            syspw           = syspw ? syspw : Environment.readConfigFrom(projectPath, "syspw");
            var project     = ProjectManager.getInstance().getProject(projectName);
            
            if (project.getFeatures().has(featureName)){
              const feature:Feature = project.getFeatures().get(featureName)!;
              var featurePath       = project.getDependenciesPath() +'/' + feature.getName() + '_' + feature.getVersion();
              if (feature instanceof ProjectFeature){
                const projectFeature = project.getFeatures().get(featureName) as ProjectFeature;
                switch (feature.getType()){
                  case FeatureType.DB:
                    var c:IConnectionProperties = DBHelper.getConnectionProps('sys', syspw, connection)!;

                    //Check if feature is already installed (this may not work properly)
                    DBHelper.isFeatureInstalled(projectFeature,c)
                      .then((installed) => {
                        /*
                          if feature installed check is negative and 
                          the current project status for this depedency is that
                          the feature needs to be installed
                        */
                        var installSteps:any = FeatureManager.getInstallSteps(projectFeature.getName());
                        if(! installed && (project.getStatus().checkDependency(projectFeature) ===  Operation.INSTALL)){ 
                          console.log(`Installing feature ${projectFeature.getName()}...`)
                        }else{
                          console.info(chalk.blue(`INFO: Feature '${projectFeature.getName()}' is already installed! Just executing the run always scripts!`));
                          installSteps.scripts = installSteps.scripts.filter((script:Script) => script.always);
                        }
                        
                        FeatureManager.unzipFeature(installSteps, project.getDependenciesPath(), projectFeature).then(()=>{
                          if (installSteps.scripts){
                            //Iterate through install script steps
                            for (var i=0; i<installSteps.scripts.length; i++){
                              //Initializing needed variables 
                              var argumentString="";        //If installstep has any arguments
                              let substeps:string[] = [];   //If installstep has substeps
                              
                              //Iterate through arguments at install step entry
                              if (installSteps.scripts[i].arguments){
                                for (var j=0; j<installSteps.scripts[i].arguments.length; j++){
                                  substeps = [];
                                  //If install-steps needs user-credentials to login to database
                                  if (installSteps.scripts[i].arguments[j] == 'credentials'){
                                    /*
                                      If the feature is to be installed in a project-schema 
                                      we need to get the credentials from xcl user config,
                                      else we get the credentials from feature config
                                    */
                                    if(project.getUsers().get(projectFeature.getUser().getName())){
                                      argumentString = " " + project.getUsers().get(projectFeature.getUser().getName())?.getConnectionName() + " ";
                                      argumentString = argumentString + project.getUsers().get(projectFeature.getUser().getName())?.getProxy()?.getPassword();
                                    }else{
                                      argumentString = " " + projectFeature.getUser().getConnectionName() + " ";
                                      argumentString = argumentString + projectFeature.getUser().getPassword();
                                    }
                                  }else if(installSteps.scripts[i].arguments[j] == 'username'){
                                    /*
                                      If the installsteps argument is 'username'
                                      check if target schema is one of the project-schemata
                                      else it is installed in a seperate schema 
                                    */
                                    if(project.getUsers().get(projectFeature.getUser().getName())){
                                      argumentString = " " +  project.getUsers().get(projectFeature.getUser().getName())?.getName();
                                    }else{
                                      argumentString = " " + projectFeature.getUser().getConnectionName(); 
                                    }
                                  }else if(installSteps.scripts[i].arguments[j] == 'usernames'){   
                                    /*
                                      If argument is 'usernames' then the script shall be executed for all the project users
                                      therefor we need to iterate over the array and execute the script n-times with the username as argument
                                    */
                                    for (let user in project.getUserNames()){

                                      substeps[user] = installSteps.scripts[i].path + ' ' + project.getUserNames()[user];
                                    }
                                  }else{
                                    argumentString = argumentString + " " + installSteps.parameters[installSteps.scripts[i].arguments[j]];
                                  }
                                }
                              }
                              
                              //when script needs to be executed as sysdba establish a connection with sysdba role
                              if (installSteps.scripts[i].sys === true){
                                connectionWithUser="sys/" + syspw + "@" + connection + " AS SYSDBA";
                                c = DBHelper.getConnectionProps('sys', syspw, connection)!;
                              }else{
                                connectionWithUser = projectFeature.getUser().getConnectionName() + "/" + projectFeature.getUser().getPassword() + "@" + connection;
                                //if script has the executeAs flag
                                if (!installSteps.scripts[i].executeAs){
                                  //and executeAs is a project-schema
                                  if(project.getUsers().has(projectFeature.getUser().getName())){
                                    c = DBHelper.getConnectionProps(project.getUsers().get(projectFeature.getUser().getName())?.getConnectionName(),
                                                                    Environment.readConfigFrom(project.getPath(), 'password', false),
                                                                    connection)!; 
                                  }else{ //else use the user defined in the feature configuration
                                    c = DBHelper.getConnectionProps(projectFeature.getUser().getConnectionName(),projectFeature.getUser().getPassword(),connection)!;
                                  }
                                }
                              }

                              var executeString="";
                              var xclScript = installSteps.scripts[i].xcl ? installSteps.scripts[i].xcl : false;    //if script is provided by xcl
                              if (!xclScript && fs.existsSync(featurePath + '/' + installSteps.scripts[i].path)){
                                executeString = Utils.checkPathForSpaces(featurePath 
                                                            + '/' 
                                                            + installSteps.scripts[i].path) 
                                                            + argumentString;
                              }else{
                                if(fs.existsSync(__dirname + "/scripts/" + installSteps.scripts[i].path)){
                                  if(xclScript){
                                    project.getLogger().getLogger().log("warning", 'Using XCL-Script instead of native script!');
                                  }
                                  executeString=Utils.checkPathForSpaces(__dirname + "/scripts/" + installSteps.scripts[i].path) + argumentString;
                                }else{
                                  throw Error(`Script '${__dirname + "/scripts/" + installSteps.scripts[i].path}' couldn't be found!`);
                                }
                              }
                              
                              //If installstep has no subprocesses to execute
                              if (substeps.length == 0){
                                //when the executeAs flag in software.yml is 'PROJECT_USER'
                                //the setup-step needs to be executed as every project-user (SINGLE or MULTI_SCHEMA)
                                if(installSteps.scripts[i].executeAs === "PROJECT_USER"){
                                  for (let [user, schema] of project.getUsers()){
                                    c = DBHelper.getConnectionProps(project.getUsers().get(user)?.getConnectionName(),
                                                                    Environment.readConfigFrom(project.getPath(), 'password', false),
                                                                    connection)!; 
                                    DBHelper.executeScript(c, executeString, project.getLogger());            
                                  }
                                }else{  //if not execute the script as feature-user
                                  DBHelper.executeScript(c, executeString, project.getLogger());
                                }
                              }else{
                                //when installstep has substeps
                                //execute them all
                                for (let s in substeps){
                                  DBHelper.executeScript(c, featurePath + '/' + substeps[s], project.getLogger());
                                }
                              }
                            }
                            fs.removeSync(projectPath + '/dependencies/' + projectFeature.getName() + '_' + projectFeature.getVersion());
                          }else{
                            throw Error('Could not find installation information! Update your software.yml file!');
                          }
                        });
                      })
                      .finally( function(){
                          projectFeature.setInstalled(true);
                          //ProjectManager.getInstance().getProject(projectName).updateFeature(feature);
                          project.getStatus().updateDependencyStatus(projectFeature);
                          resolve();
                        }
                      );
                    break;
                case FeatureType.DEPLOY:
                    FeatureManager.unzipFeature(undefined, project.getDependenciesPath(), projectFeature).then(()=>{
                      deliveryFactory.getNamed<DeliveryMethod>("Method",featureName.toUpperCase()).install(projectFeature, projectPath, project.getMode() === 'multi' ? false : true);
                      feature.setInstalled(true);
                      project.updateFeature(projectFeature);
                      resolve();
                    });
                }
              }else if (feature instanceof CustomFeature){
                const customFeature  = project.getFeatures().get(featureName) as CustomFeature;
                var c:IConnectionProperties = DBHelper.getConnectionProps('sys', syspw, connection)!;
                DBHelper.schemaExists(c, customFeature.getUser().getName()).then(exists=>{
                  if (!exists){
                    DBHelper.executeScript(c, Utils.checkPathForSpaces(`${__dirname}/scripts/create_user.sql`) +` ${customFeature.getUser().getName()} ${customFeature.getUser().getPassword()}`, project.getLogger());
                  }

                  if(project.getUsers().has(customFeature.getUser().getName())){
                    c = DBHelper.getConnectionProps(project.getUsers().get(customFeature.getUser().getName())?.getConnectionName(),
                                                    Environment.readConfigFrom(project.getPath(), 'password', false),
                                                    connection)!; 
                  }else{ //else use the user defined in the feature configuration
                    c = DBHelper.getConnectionProps(customFeature.getUser().getConnectionName(),customFeature.getUser().getPassword(),connection)!;
                  }
                  
                  FeatureManager.unzipFeature(undefined, project.getDependenciesPath(), customFeature).then(()=>{
                    DBHelper.executeScript(c, `${featurePath}/${customFeature.getInstallScript()}`, project.getLogger());
                    resolve();
                  });
                });
              }
            }else{
              console.log(chalk.red('ERROR: Dependency missing! Execute ´xcl feature:add´ first!'));
              reject();
            } 
          });
      }

      public deinstallProjectFeature(featureName:string, connection:string, syspw:string, projectName:string):Promise<void>{
        return new Promise((resolve, reject)=>{
          var connectionWithUser="";
          var projectPath=ProjectManager.getInstance().getProject(projectName).getPath();
          var project:Project = ProjectManager.getInstance().getProject(projectName);
          var c:IConnectionProperties;
          syspw = syspw ? syspw : Environment.readConfigFrom(projectPath, "syspw");  
            if (project.getFeatures().has(featureName)){

              let feature:ProjectFeature=project.getFeatures().get(featureName) as ProjectFeature;
              var deinstallSteps = FeatureManager.getDeinstallSteps(feature.getName());

              const featurePath:string = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
              FeatureManager.unzipFeature(deinstallSteps, project.getDependenciesPath(), feature)
                .then(()=>{
                  if (deinstallSteps.scripts){
                    for (var i=0; i<deinstallSteps.scripts.length; i++){
                      var argumentString="";
                      var argumentValues=[];

                      if (deinstallSteps.scripts[i].arguments){
                        for (var j=0; j<deinstallSteps.scripts[i].arguments.length; j++){
                          if (deinstallSteps.scripts[i].arguments[j] == 'credentials'){
                            argumentString = " " + feature.getUser().getName() + " ";
                            argumentString = argumentString+feature.getUser().getPassword();
                          }else if(deinstallSteps.scripts[i].arguments[j] == 'username'){
                            if(project.getUsers().get(feature.getUser().getName())){
                              argumentString = " " +  project.getUsers().get(feature.getUser().getName())?.getName();
                            }else{
                              if (project.getUsers().get(feature.getUser().getConnectionName())){
                                argumentString = " " + project.getUsers().get(feature.getUser().getConnectionName())?.getName();
                              }else{
                                argumentString = " " + feature.getUser().getConnectionName(); 
                              }
                              
                            }
                          }else{
                            argumentString = argumentString + " " + deinstallSteps.parameters[deinstallSteps.scripts[i].arguments[j]];
                          }
                        }
                      }

                      if (deinstallSteps.scripts[i].sys === true){
                        //connectionWithUser="sys/" + syspw + "@" + connection + " AS SYSDBA";
                        c = DBHelper.getConnectionProps('sys',syspw,connection)!;
                      }else{
                        //connectionWithUser=feature.getUser().getConnectionName() + "/" + feature.getUser().getPassword() + "@" + connection;
                        if (project.getUsers().get(feature.getUser().getConnectionName())){
                          let user:Schema = project.getUsers().get(feature.getUser().getConnectionName())!;
                          c = DBHelper.getConnectionProps(user.getConnectionName(),user.getPassword() ? user.getPassword() : Environment.readConfigFrom(project.getPath(),'password', false),connection)!;
                        }else{
                          c = DBHelper.getConnectionProps(feature.getUser().getConnectionName(),feature.getUser().getPassword(),connection)!;
                        }
                      }

                      var executeString="";
                      if (fs.existsSync(featurePath + '/' + deinstallSteps.scripts[i].path)){
                        executeString = Utils.checkPathForSpaces(projectPath + '/dependencies/' 
                                                    + feature.getName() 
                                                    + '_' 
                                                    + feature.getReleaseInformation() 
                                                    + '/' 
                                                    + deinstallSteps.scripts[i].path) 
                                                    + argumentString;
                      }else{
                        if(fs.existsSync(__dirname + "/scripts/" + deinstallSteps.scripts[i].path)){
                          executeString=Utils.checkPathForSpaces(__dirname + "/scripts/" + deinstallSteps.scripts[i].path) + argumentString;
                        }else{
                          console.log(__dirname + "/scripts/" + deinstallSteps.scripts[i].path);
                          throw Error("Script couldn't be found!");
                        }
                      }
                      DBHelper.executeScript(c, executeString, project.getLogger());
                    }
                    fs.removeSync(projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation());
                  }else{
                    throw Error('Could not find installation information! Update your software.yml File!');
                  }
                })
                .finally(function(){
                  feature.setInstalled(false);
                  project.updateFeature(feature);
                  project.getStatus().updateDependencyStatus(feature, true);
                  resolve();
                });
            }else{
              console.log(chalk.red('ERROR: Dependency missing! Execute ´xcl feature:add´ first!'));
              reject();
            }
        }); 
      }  

      public dropOwnerSchema(featureName:string, connection:string, syspw:string, projectName:string):Promise<void>{
        return new Promise((resolve,reject)=>{
            var projectPath=ProjectManager.getInstance().getProject(projectName).getPath();
            const c:IConnectionProperties = DBHelper.getConnectionProps('sys',syspw,connection)!;
            const project = ProjectManager.getInstance().getProject(projectName);
            if (!project.getUsers().get(project.getFeatures().get(featureName)?.getUser().getName()!)){
              if (project.getFeatures().has(featureName)){
                DBHelper.executeScript(c,`${__dirname}/scripts/drop_user.sql ${project.getFeatures().get(featureName)?.getUser().getConnectionName()}`, project.getLogger() );
                resolve();
              }else{
                reject();
              }
            }else{
              console.log(chalk.red('ERROR: You can not drop a project schema'));
            }
        });
      }

      private static unzipFeature(installSteps:any, projectPath:string, feature:Feature):Promise<void>{
        return new Promise((resolve, reject)=>{
          try{
            if (installSteps && installSteps.installzip){
              var zip = new AdmZip(projectPath + '/' + feature.getName() + '_' + feature.getVersion() + '.zip');
              zip.extractAllTo(projectPath + '/');
              var zipEntries = zip.getEntries();
              var unzipped = zipEntries[0].entryName.toString();
              fs.renameSync(projectPath + '/' + unzipped,
                            projectPath + '/' + feature.getName().toLowerCase() + '_' + feature.getVersion() + '_tmp');
              var pathTmp = projectPath + '/' + feature.getName().toLowerCase() + '_' + feature.getVersion() + '_tmp';
              
              zip = new AdmZip(pathTmp + '/' + installSteps.installzip[0].path + '/' + feature.getName().toLowerCase() + '_'+feature.getVersion() + '.zip');

              zip.extractAllTo(projectPath + '/' + feature.getName().toLowerCase() + '_' + feature.getVersion() + '/');
              fs.removeSync(pathTmp);
            }else{
              var zip = new AdmZip(projectPath + '/' + feature.getName() + '_' + feature.getVersion() + '.zip');
              zip.extractAllTo(projectPath+'/');
              var zipEntries = zip.getEntries();
              var unzipped = zipEntries[0].entryName.toString();
              fs.renameSync(projectPath + '/' + unzipped,
                            projectPath + '/' + feature.getName().toLowerCase() + '_' + feature.getVersion());
            }
            resolve();  
          }catch(err){
            console.log(err);
            console.log(chalk.red('ERROR: Could not handle feature archive!'));
          }
        });
      }

      private static getInstallSteps(featureName:string):any{
        if(FeatureManager.softwareJson.software[featureName]){
          return FeatureManager.softwareJson.software[featureName].install;
        }else{
          throw Error('Could not find install information! Please update your software.yml File!');
        }
      }

      private static getDeinstallSteps(featureName:string):any{
        if(FeatureManager.softwareJson.software[featureName]){
          return FeatureManager.softwareJson.software[featureName].uninstall;
        }else{
          throw Error('Could not find deinstall information! Please update your software.yml File!');
        }
      }

      public static priviledgedInstall(featureName:string):boolean{
        if(FeatureManager.softwareJson.software[featureName]){
          let installSteps = FeatureManager.softwareJson.software[featureName].install
          for (var i=0; i<installSteps.scripts.length; i++){
            if(installSteps.scripts[i].sys){
              return true;
            }
          }
          return false;
        }else{
          throw Error('Could not find install information! Please update your software.yml File!');
        }
      }

      public static updateFeatureVersion(featureName:string, version:string, projectName:string, connection:string, syspw:string):Promise<void>{
        return new Promise((resolve, reject)=>{
          if (ProjectManager.getInstance().getProject(projectName).getFeatures().has(featureName)){
            let p:Project = ProjectManager.getInstance().getProject(projectName);
            let feature = p.getFeatures().get(featureName) as ProjectFeature;
            let newFeature = feature;
            
            syspw = syspw ? syspw : Environment.readConfigFrom( p.getPath(), "syspw");

            newFeature?.setVersion(version);
            FeatureManager.getInstance().deinstallProjectFeature(featureName, connection, syspw, projectName)
              .then(function(){
                FeatureManager.getInstance().dropOwnerSchema(featureName, connection, syspw, projectName)
                  .then(function(){
                    FeatureManager.getInstance().removeFeatureFromProject(featureName, projectName)
                      .then(function(){
                        FeatureManager.getInstance().addFeatureToProject(featureName, version, projectName, newFeature?.getUser().getConnectionName()!, newFeature?.getUser().getPassword()!)
                          .then(function(){
                            FeatureManager.getInstance().installProjectFeature(featureName, connection, syspw, projectName)
                              .then(function(){
                                resolve();
                              })
                          })
                      })
                  })
              });
          }else{
            console.log(chalk.yellow(`WARNING: Feature ${featureName} was not added to the Project!`));
            console.log(chalk.blueBright(`INFO: xcl feature:add ${featureName} ${version} ${projectName}`));
            reject();
          }
        });
      }

      public removeFeatureFromProject(featureName:string, projectName:string):Promise<void>{
        return new Promise((resolve, reject)=>{
          let project = ProjectManager.getInstance().getProject(projectName);
          if( project.getFeatures().has(featureName) ){
            let feature:ProjectFeature = project.getFeatures().get(featureName) as ProjectFeature;
            if ( feature.getType() === 'DEPLOY' ){
              deliveryFactory.getNamed<DeliveryMethod>( "Method", project.getDeployMethod().toUpperCase() ).remove(feature, project.getPath(), project.getMode() === Project.MODE_SINGLE);
            }
            
            project.removeFeature(feature);
            console.log(chalk.green(`SUCCESS: Feature ${featureName} removed!`));
            resolve();
          }else{
            console.log(chalk.yellow(`WARNING: Feature ${featureName} not in dependency list! Nothing removed!`));
            reject();
          }
        });
      }

      public getFeatureType(featureName:string, projectName:string){
        if(FeatureManager.features.has(featureName)){
          return FeatureManager.features.get(featureName)?.getType();
        }else{
          return ProjectManager.getInstance().getProject(projectName).getFeatures().get(featureName)?.getType();
        }
      }

      static async getUsername(projectName:string):Promise<any> {
        // read project and env to show current values
        let prj:any = fs.existsSync("xcl.yml") ? yaml.parse(fs.readFileSync("xcl.yml").toString()) : { xcl: {project: projectName} };
        let env:any = fs.existsSync(".xcl/env.yml") ? yaml.parse(fs.readFileSync(".xcl/env.yml").toString()) : { };
        let project:Project = ProjectManager.getInstance().getProject(projectName!);
        let answer = await inquirer.prompt([{
      
            name: 'username',
            message: `Install Feature in: `,
            type: 'list',
            choices: Array.from(project.getUserNames()).concat(['Other'])
        }]);
      
        if (answer.username === 'Other'){
        answer = await inquirer.prompt([{
      
            name: 'username',
            message: `Enter username: `,
            type: 'input'
          },
          {
            name: 'password',
            message: `Enter password:`,
            type: 'password'
          }]);
        }else{
          let username:string = answer.username;
          let user:string = username.replace(projectName.toUpperCase()+'_','');;
          answer.username = user.toUpperCase()
        }
      
        return answer;
      }

      public getFeatures():string[]{
        return Array.from(FeatureManager.features.keys());
      }

      public static async doFeatureWizard(project:Project){
        let user:any;
        let featureList = await inquirer.prompt([{
          name: "features",
          message: "Choose features: ",
          type: 'checkbox',
          choices: FeatureManager.getInstance().getFeatures()
        }]);

        for(let i = 0; i<featureList.features.length; i++){
          let version = await inquirer.prompt([{
            name: 'number',
            message: `choose a version for ${featureList.features[i]}: `,
            type: 'list',
            choices: await FeatureManager.getInstance().getFeatureReleases(featureList.features[i])
          }]);

          if(FeatureManager.getInstance().getFeatureType(featureList.features[i], project.getName()) === "DB"){
            user = await FeatureManager.getUsername(project.getName());
          }

          await FeatureManager.getInstance().addFeatureToProject(featureList.features[i],version.number, project.getName(), user.username, user.password); 
        }
      }

}