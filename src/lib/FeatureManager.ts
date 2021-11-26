//Imports
import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as os from "os";
import * as request from "request-promise-native";
import chalk from 'chalk'
import { Feature } from './Feature';
import { ProjectManager } from './ProjectManager';
import { ProjectFeature } from './ProjectFeature';
import { GithubCredentials } from './GithubCredentials';
import * as AdmZip from "adm-zip";
import { DBHelper, IConnectionProperties } from './DBHelper';
import  { deliveryFactory }  from './DeliveryFactory';
import { DeliveryMethod } from './DeliveryMethod';
import {Project} from './Project';
import { Environment } from './Environment';
import { Operation } from './Operation';
import { Utils } from './Utils';
import { Logger } from "./Logger";
import inquirer = require("inquirer");
import { Schema } from "./Schema";
const Table = require('cli-table');

export class FeatureManager{
    public static softwareYMLfile: string = "software.yml";

    private static manager: FeatureManager;
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";
    private static softwareYaml: yaml.Document;
    private static softwareJson: any;
    private static features: Map<string, Feature>;
 

    private constructor(){
        FeatureManager.softwareYaml = yaml.parseDocument(fs.readFileSync(FeatureManager.xclHome + "/" 
                                                            + FeatureManager.softwareYMLfile).toString());


        // convert to json of create an empty definition
        FeatureManager.softwareJson = FeatureManager.softwareYaml.toJSON();
        FeatureManager.features = new Map();

        Object.keys(FeatureManager.softwareJson.software).forEach(function(softwareName){
          let softwareJSON = FeatureManager.softwareJson.software[softwareName];
          let featureType="";
         
          if (softwareJSON.deploy){
            featureType="DEPLOY";
          }else{
            featureType="DB";
          }
            
          FeatureManager.features.set(softwareName, new Feature({ name: softwareName, 
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
            if (feature.getType()===type || type==="all"){
              table.push([ feature.getName(), feature.getRepo(), feature.getOwner(), feature.getType() ]);
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
            if (feature.getType()===type || type==="all"){
              if(p.getFeatures().has(feature.getName())){
                table.push([ feature.getName(), feature.getRepo(), feature.getOwner(), feature.getType(),'added ',  p.getFeatures().get(feature.getName())?.getStatus()]);
              }else{
                table.push([ feature.getName(), feature.getRepo(), feature.getOwner(), feature.getType(),'not added','' ]);
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
              resolve((FeatureManager.features.get(name.toLowerCase()) ! ).getReleaseInformation());
          }else{
            throw Error('Unknown Feature: '+name+' Try: xcl feature:list');
          }
        });
      }

      public addFeatureToProject(featureName:string, version:string, projectName:string, username: string, password: string):Promise<boolean>{
        return new Promise((resolve,reject)=>{
          let pManager:ProjectManager=ProjectManager.getInstance();
          let added = pManager.getProject(projectName).addFeature( (this.getProjectFeature(featureName, version, username, password) ! ));
          if (added){
            this.downloadFeature(pManager.getProject(projectName).getFeatures().get(featureName)!, projectName).then(()=>resolve(true));
          }else{
            resolve(false);
          }
          
        });
      }

      private downloadFeature(feature:ProjectFeature, projectName:string):Promise<void>{
        let pManager:ProjectManager=ProjectManager.getInstance();
        return new Promise((resolve, reject)=>{
          var filename = pManager.getProject(projectName).getPath() +'/dependencies/'+feature.getName()+'_'+feature.getReleaseInformation()+'.zip';
          feature.getDownloadUrl()
                    .then(function(url){
                    var options = {
                      uri: "",
                      headers: {}
                    };
                    
                    options.uri=url;

                    if (GithubCredentials.get()){
                        options.headers= {
                            'User-Agent': 'xcl',
                            'Authorization': 'token ' + GithubCredentials.get()
                        };
                    }else{
                      options.headers= {
                        'User-Agent': 'xcl'
                      }
                    }

              if(!fs.pathExistsSync(pManager.getProject(projectName).getPath() +'/dependencies')){
                  fs.mkdirSync(pManager.getProject(projectName).getPath() +'/dependencies');
              }

              request(options)
                    .pipe(
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

        let feature:ProjectFeature;
        let project:Project = ProjectManager.getInstance().getProject(projectName);
        for(feature of project.getFeatures().values()){
          if (feature.getType()===type || type==="all"){
            if (feature.getType()==='DEPLOY'){
              table.push([
                feature.getName(), 
                feature.getReleaseInformation(),
                feature.getType(),
                feature.getStatus()
              ]);
            }else{
              table.push([
                feature.getName(), 
                feature.getReleaseInformation(),
                feature.getType(),
                (project.getStatus().getDependencyStatus(feature)?chalk.green('installed'):chalk.red('uninstalled'))
              ]);
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
            feature = new ProjectFeature({parent: (FeatureManager.features.get(featureName.toLowerCase()) !),
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

      public async installAllProjectFeatures(projectName:string, connection:string, syspw:string, forceInstall:boolean){
        for (const feature of ProjectManager.getInstance().getProject(projectName).getFeaturesOfType('DB').values()){
          if(feature.isInstalled() && forceInstall){
            await FeatureManager.updateFeatureVersion(feature.getName(), feature.getReleaseInformation().toString(), projectName, connection, syspw);
          }else{
            FeatureManager.getInstance().installProjectFeature(feature.getName(), connection, syspw, projectName);
          }
        }
      }

      public installProjectFeature(featureName:string, connection:string, syspw:string, projectName:string):Promise<void>{
          return new Promise((resolve, reject)=>{
            var connectionWithUser="";
            var projectPath=ProjectManager.getInstance().getProject(projectName).getPath();
            syspw = syspw ? syspw : Environment.readConfigFrom(projectPath, "syspw");
            var project = ProjectManager.getInstance().getProject(projectName);
            
            if (project.getFeatures().has(featureName)){
              let feature:ProjectFeature=project.getFeatures().get(featureName)!;
              var featurePath =projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
              if (feature.getType()==="DB"){
                var c:IConnectionProperties = DBHelper.getConnectionProps('sys', syspw, connection);
                DBHelper.isFeatureInstalled(feature,c)
                  .then((installed) => {
                    if(! installed && (project.getStatus().checkDependency(feature) ===  Operation.INSTALL)){ 
                      var installSteps = FeatureManager.getInstallSteps(feature.getName());
                      FeatureManager.unzipFeature(installSteps, projectPath, feature).then(()=>{
                        if (installSteps.scripts){
                          for (var i=0; i<installSteps.scripts.length; i++){
                            var argumentString="";
                            let substeps:string[] = [];
                            if (installSteps.scripts[i].arguments){
                              for (var j=0; j<installSteps.scripts[i].arguments.length; j++){
                                substeps = [];
                                if (installSteps.scripts[i].arguments[j] == 'credentials'){
                                  if(project.getUsers().get(feature.getUser().getName())){
                                    argumentString = " " + project.getUsers().get(feature.getUser().getName())?.getConnectionName() + " ";
                                    argumentString = argumentString + project.getUsers().get(feature.getUser().getName())?.getProxy()?.getPassword();
                                    console.log('FEATURE INSTALL: ', argumentString);
                                  }else{
                                    argumentString = " " + feature.getUser().getConnectionName() + " ";
                                    argumentString = argumentString+feature.getUser().getPassword();
                                  }
                                }else if(installSteps.scripts[i].arguments[j] == 'username'){
                                  if(project.getUsers().get(feature.getUser().getName())){
                                    argumentString = " " +  project.getUsers().get(feature.getUser().getName())?.getName();
                                  }else{
                                    argumentString = " " + feature.getUser().getConnectionName(); 
                                  }
                                }else if(installSteps.scripts[i].arguments[j] == 'usernames'){
                                  let k = 0;
                                  for (let user in project.getUserNames()){

                                    substeps[user] = installSteps.scripts[i].path + ' ' + project.getUserNames()[user];
                                  }
                                  console.log(substeps);
                                }else{
                                  argumentString = argumentString + " " + installSteps.parameters[installSteps.scripts[i].arguments[j]];
                                }
                              }
                            }

                            if (installSteps.scripts[i].sys === true){
                              connectionWithUser="sys/" + syspw + "@" + connection + " AS SYSDBA";
                              c = DBHelper.getConnectionProps('sys',syspw,connection);
                            }else{
                              connectionWithUser=feature.getUser().getConnectionName() + "/" + feature.getUser().getPassword() + "@" + connection;
                              if (!installSteps.scripts[i].executeAs){
                                if(project.getUsers().has(feature.getUser().getName())){
                                  c = DBHelper.getConnectionProps(project.getUsers().get(feature.getUser().getName())?.getConnectionName(),
                                                                  Environment.readConfigFrom(project.getPath(), 'password', false),
                                                                  connection); 
                                }else{
                                  c = DBHelper.getConnectionProps(feature.getUser().getConnectionName(),feature.getUser().getPassword(),connection);
                                }
                              }
                            }

                            var executeString="";
                            var xclScript = installSteps.scripts[i].xcl ? installSteps.scripts[i].xcl : false;
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

                            if (substeps.length == 0){
                              if(installSteps.scripts[i].executeAs === "PROJECT_USER"){
                                for (let [user, schema] of project.getUsers()){
                                  c = DBHelper.getConnectionProps(project.getUsers().get(user)?.getConnectionName(),
                                                                  Environment.readConfigFrom(project.getPath(), 'password', false),
                                                                  connection); 
                                  DBHelper.executeScript(c, executeString, project.getLogger());            
                                }
                              }
                              else{ 
                                DBHelper.executeScript(c, executeString, project.getLogger());
                              }
                            }else{
                              for (let s in substeps){
                                DBHelper.executeScript(c, featurePath + '/' + substeps[s], project.getLogger());
                              }
                            }
                          }
                          fs.removeSync(projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation());
                        }else{
                          throw Error('Could not find installation information! Update your software.yml File!');
                        }
                      });
                      }else{
                        console.warn(chalk.yellow(`WARNING: Feature '${feature.getName()}' is already installed! First remove feature or use xcl feature:update!`));
                        //ProjectManager.getInstance().getProject(projectName).updateFeature(feature);
                        project.getStatus().updateDependencyStatus(feature);
                        resolve();
                      }
                  })
                  .finally( function(){
                      feature.setInstalled(true);
                      //ProjectManager.getInstance().getProject(projectName).updateFeature(feature);
                      project.getStatus().updateDependencyStatus(feature);
                      resolve();
                    }
                  );
              }else{
                if(feature.getType() === "DEPLOY"){
                  FeatureManager.unzipFeature(undefined, projectPath, feature).then(()=>{
                    deliveryFactory.getNamed<DeliveryMethod>("Method",featureName.toUpperCase()).install(feature, projectPath, project.getMode() === 'multi' ? false : true);
                    feature.setInstalled(true);
                    project.updateFeature(feature);
                    resolve();
                  });
                }
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

              let feature:ProjectFeature=project.getFeatures().get(featureName)!;
              var deinstallSteps = FeatureManager.getDeinstallSteps(feature.getName());

              const featurePath:string = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
              FeatureManager.unzipFeature(deinstallSteps, projectPath, feature)
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
                        c = DBHelper.getConnectionProps('sys',syspw,connection);
                      }else{
                        //connectionWithUser=feature.getUser().getConnectionName() + "/" + feature.getUser().getPassword() + "@" + connection;
                        if (project.getUsers().get(feature.getUser().getConnectionName())){
                          let user:Schema = project.getUsers().get(feature.getUser().getConnectionName())!;
                          c = DBHelper.getConnectionProps(user.getConnectionName(),user.getPassword() ? user.getPassword() : Environment.readConfigFrom(project.getPath(),'password', false),connection);
                        }else{
                          c = DBHelper.getConnectionProps(feature.getUser().getConnectionName(),feature.getUser().getPassword(),connection);
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
            const c:IConnectionProperties = DBHelper.getConnectionProps('sys',syspw,connection);
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

      private static unzipFeature(installSteps:any, projectPath:string, feature:ProjectFeature):Promise<void>{
        return new Promise((resolve, reject)=>{
          if (installSteps && installSteps.installzip){
            var zip = new AdmZip(projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation() + '.zip');
            zip.extractAllTo(projectPath + '/dependencies/');
            var zipEntries = zip.getEntries();
            var unzipped = zipEntries[0].entryName.toString();
            fs.renameSync(projectPath + '/dependencies/' + unzipped,
                          projectPath + '/dependencies/' + feature.getName().toLowerCase() + '_' + feature.getReleaseInformation() + '_tmp');
            var pathTmp = projectPath + '/dependencies/' + feature.getName().toLowerCase() + '_' + feature.getReleaseInformation() + '_tmp';
            
            zip = new AdmZip(pathTmp + '/' + installSteps.installzip[0].path + '/' + feature.getName().toLowerCase() + '_'+feature.getReleaseInformation() + '.zip');

            zip.extractAllTo(projectPath + '/dependencies/' + feature.getName().toLowerCase() + '_' + feature.getReleaseInformation() + '/');
            fs.removeSync(pathTmp);
          }else{
            var zip = new AdmZip(projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation() + '.zip');
            zip.extractAllTo(projectPath+'/dependencies/');
            var zipEntries = zip.getEntries();
            var unzipped = zipEntries[0].entryName.toString();
            fs.renameSync(projectPath + '/dependencies/' + unzipped,
                          projectPath + '/dependencies/' + feature.getName().toLowerCase() + '_' + feature.getReleaseInformation());
          }
          resolve();
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
            let feature = p.getFeatures().get(featureName);
            let newFeature = feature;
            
            syspw = syspw ? syspw : Environment.readConfigFrom( p.getPath(), "syspw");

            newFeature?.setReleaseInformation(version);
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
          if(ProjectManager.getInstance().getProject(projectName).getFeatures().has(featureName)){
            ProjectManager.getInstance().getProject(projectName).removeFeature(ProjectManager.getInstance().getProject(projectName).getFeatures().get(featureName)!);
            console.log(chalk.green(`SUCCESS: Feature ${featureName} removed!`));
            resolve();
          }else{
            console.log(chalk.yellow(`WARNING: Feature ${featureName} not in dependency list! Nothing removed!`));
            reject();
          }
        });
      }

      public getFeatureType(featureName:string){
        if(FeatureManager.features.has(featureName)){
          return FeatureManager.features.get(featureName)?.getType();
        }else{
         console.log(chalk.red("ERROR: Unkown Feature!")) 
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

          if(FeatureManager.getInstance().getFeatureType(featureList.features[i]) === "DB"){
            user = await FeatureManager.getUsername(project.getName());
          }

          await FeatureManager.getInstance().addFeatureToProject(featureList.features[i],version.number, project.getName(), user.username, user.password); 
        }
      }

}