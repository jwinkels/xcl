import * as yaml from "yaml";
import * as fs from "fs-extra";
import chalk from 'chalk'
import { ProjectFeature } from './ProjectFeature';
import { FeatureManager } from './FeatureManager';
import { Schema } from './Schema';
import  * as os from 'os';
import { Environment } from './Environment';
import { Md5 } from 'ts-md5/dist/md5';
import md5 = require('md5');
import { version } from 'process';

export class Project {
  private name: string;                           //Project-Name
  private path: string; 	                        //Project-Home
  private errorText: string = '';                 //Individual Error-Messages
  private config: any;                            //YAML-Structure that contains all project-configuration
  private features: Map<String, ProjectFeature>;  //Map to save the added features
  private users: Map<String, Schema>;              //Map for Project User-List
  private status: ProjectStatus;
  private environment:Map<string, string>;

  constructor(name: string, path: string, workspaceName:string , create: boolean) {
    this.name = name;
    this.path = path;

    if (create) {
      this.config = this.initialzeConfig(workspaceName);
      this.features=new Map();
      this.users=new Map();
      this.createDirectoryStructure();
      this.status = new ProjectStatus(this);
      this.writeConfig();
      this.status.serialize()
      this.environment=Environment.initialize(name);

    } else {
      this.config = this.readConfig();
      this.status = new ProjectStatus(this);      
      this.features = this.getFeatures();
      this.users = this.getUsers();
      this.environment=Environment.initialize(name);
    }
  }

  public getErrorText(): string {
    return this.errorText;
  }

  public getPath(): string {
    return this.path;
  }

  public getName(): string {
    
    if (this.name == ''){
      this.name=this.config.xcl.project;
    }

    return this.name;
  }

  public getVersion():string{
    if(this.config){
      return this.config.xcl.version;
    }else{
      this.config=this.readConfig();
      return this.config.xcl.version;
    }
  }

  public setVersion(version:string){
    if(!this.config.xcl.version){
      this.config=this.readConfig(); 
    }

    this.config.xcl.version=version;
    this.writeConfig();
  }


  public getWorkspace():string{
    if(this.config){
      return this.config.xcl.workspace;
    }else{
      this.config=this.readConfig();
      return this.config.xcl.workspace;
    }
  }

  public setWorkspace(workspaceName:string){
    if(!this.config.xcl.workspace){
      this.config=this.readConfig(); 
    }

    this.config.xcl.workspace=workspaceName;
    this.writeConfig();
  }

  public toJSON(): any {
    return { path: this.getPath() };
  }

  private createDirectoryPath(path: any, fullPath: string) {
    if (path instanceof Array) {
      for (let i = 0; i < path.length; i++) {
        this.createDirectoryPath(path[i], fullPath);
      }
    } else if (path instanceof Object) {
      for (let i = 0; i < Object.keys(path).length; i++) {
        let objName = Object.keys(path)[i];
        this.createDirectoryPath(path[objName], fullPath + objName + "/");
      }
    } else {
      if (!fs.existsSync(this.getPath() + fullPath + path)) {
        fullPath = this.getPath() + fullPath + path;        
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  private createDirectoryStructure() {
    let parsedDirs = yaml.parseDocument(fs.readFileSync(__dirname + "/config/directories.yml").toString());

    this.createDirectoryPath(parsedDirs.toJSON(), "/");
    
    fs.renameSync(this.getPath() + "/db/data", this.getPath() + `/db/${this.getName()}_data`);
    fs.renameSync(this.getPath() + "/db/logic", this.getPath() + `/db/${this.getName()}_logic`);
    fs.renameSync(this.getPath() + "/db/app", this.getPath() + `/db/${this.getName()}_app`);
    fs.copySync(__dirname + "/config/readme.md", this.getPath()+"/readme.md");
  }

  public writeConfig() {    
    fs.writeFileSync(this.getPath() + "/" + "xcl.yml", yaml.stringify(this.config));    
  }

  private initialzeConfig(workspaceName: string) {
    return {
      xcl: {
        project: this.getName(),
        description: "XCL- Projekt " + this.getName(),
        version: "Release 1.0",
        workspace: workspaceName,
        users: {
          schema_app: this.getName() + "_app",
          schema_logic: this.getName() + "_logic",
          schema_data: this.getName() + "_data",
          user_deployment: this.getName() + "_depl",
          user_sys: "sys",
        },
      },
    };
  }

  private readConfig():any{
    let conf:string
    let confObject;

    try {
      conf = fs.readFileSync(this.getPath() + "/xcl.yml").toString();      
    } catch (err) {
      if (err.code === 'ENOENT') {        
        conf = yaml.stringify({xcl: {
                                project: this.getName(),
                                errtext: 'File not found!'
                              }});
        this.errorText = 'File not found!';
      } else {
        throw err;
      }
      
    }

    return yaml.parse(conf);
  }

  //
  public addFeature(feature:ProjectFeature){
    let dependencyConf:any = "";

    //Do not add the Feature if it is already in dependency list or if deployment method has already been configured 
    if ( ! this.features.has(feature.getName()) || !(feature.getType()==="DEPLOY" && this.hasDeployMethod())){  
      this.config=this.readConfig();
      this.features.set(feature.getName(),feature);
      if(!this.config.xcl.dependencies){
        this.config.xcl.dependencies=[];
        this.status.updateStatus();
      }

      //DEPLOY-Feature using the existing users to connect to the database and deploy the objects 
      if(feature.getType()==="DEPLOY"){
        dependencyConf = {
              name: feature.getName(), 
              version: feature.getReleaseInformation(),
              //installed: feature.getInstalled(),
              type: feature.getType()
          };
        
      }else{
        dependencyConf = {
                name: feature.getName(), 
                version: feature.getReleaseInformation(),
                //installed: feature.getInstalled(),
                type: feature.getType(),
                user:{
                    name: feature.getUser().getName(),
                    pwd: feature.getUser().getPassword()
                    }
                };
      }
      this.config.xcl.dependencies.push(dependencyConf);
      this.writeConfig();
    }else{
      if ( this.features.has(feature.getName()) ){
        console.log(chalk.yellowBright('WARNING: Dependency is already defined to this Project! No dependency added!'));
        console.log(chalk.blueBright('INFO: To Update the dependency use feature:update'));
      }

      if( feature.getType()==="DEPLOY" && this.hasDeployMethod() ){
        console.log(chalk.red('ERROR: deployment already configured! Remove the feature before adding a new deployment configuration!'));
      }
    }
  }

  private hasDeployMethod():Boolean{
    let deployMethodAvailable=false;
    this.features.forEach(function(feature){
      
      if(feature.getType() === "DEPLOY"){
        deployMethodAvailable = true;
      }

    });
    return deployMethodAvailable;
  }

  public getDeployMethod():string{
    let method="";
    if(this.hasDeployMethod()){
      this.features.forEach(function(feature){
        if (feature.getType()=='DEPLOY'){
          method=feature.getName();
        }
      });
    }
    return method;
  }

  public removeFeature(feature:ProjectFeature){
    if (this.features.has(feature.getName())){  
      this.config=this.readConfig();
      this.features.delete(feature.getName());
      if(!this.config.xcl.dependencies){
        console.log('No dependencies!');
        this.config.xcl.dependencies=[];
      }

      this.config.xcl.dependencies = this.config.xcl.dependencies.filter((obj: { name: string; version: String; installed: Boolean; user: { name: string; pwd: string; }; }) => obj.name !== feature.getName())

      this.writeConfig();
    }else{
      console.log(chalk.yellowBright('WARNING: Dependency is not defined to this Project! No dependency removed!'));
    }
  }

  //INFO: Read all Features from configuration and write it to feature-Map < String, ProjectFeature >
  public getFeatures():Map<String,ProjectFeature>{
    let features: Map<String, ProjectFeature> = new Map<String, ProjectFeature>();
    let featureManager = FeatureManager.getInstance();
    this.config=this.readConfig();
    
    if (this.config.xcl?.dependencies){
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: Boolean; type:string; user:any}) => {
        switch(element.type){
          case "DB": { 
            features.set(element.name,(featureManager.getProjectFeature(element.name,element.version, element.user.name, element.user.pwd, element.installed) ! )); 
            break;
          }
          case "DEPLOY": {
            features.set(element.name,(featureManager.getProjectFeature(element.name,element.version, "", "", element.installed) ! )); 
            break;
          }
          default:{
            console.log(chalk.red("ERROR: Unkown Feature Type"));
            break;
          }
        }
           
      });      
    }else{
      return features;
    }
    return features;
  }

  public getFeaturesOfType(type:string):Map<String,ProjectFeature>{
    let features: Map<String,ProjectFeature> = new Map<String,ProjectFeature>();
    this.config = this.readConfig();
    if (this.config.xcl?.dependencies){
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: Boolean; type:string; user:any}) => {
        if (element.type==type){
          features.set(element.name,(FeatureManager.getInstance().getProjectFeature(element.name,element.version, element.user.name, element.user.pwd, element.installed) ! ));    
        }
      });      
    }else{
      return features;
    }
    return features;
  }

  public updateFeature(feature:ProjectFeature){
    if (this.features.has(feature.getName())){  
      this.config=this.readConfig();
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; }) => {
        if(element.name===feature.getName()){
          element.version=feature.getReleaseInformation();
        }
      });
      this.writeConfig();
      this.status.updateStatus();
    }
  }

  public getUsers():Map<String,Schema>{
    this.config=this.readConfig();
    this.users=new Map<String,Schema>();
    if(this.config.xcl?.users){
      let users=this.config.xcl?.users;
        let proxy= new Schema({name: users.user_deployment, password:"", proxy:undefined});
        this.users.set('APP',new Schema({name: users.schema_app, password:"", proxy:proxy}));
        this.users.set('LOGIC',new Schema({name: users.schema_logic, password:"", proxy:proxy}));
        this.users.set('DATA',new Schema({name: users.schema_data, password:"", proxy:proxy}));
    }
    return this.users;
  }

  public getConfig():any{
    return this.config;
  }

  public getStatus():ProjectStatus{
    return this.status;
  }

  public getEnvironment():Map<string, string>{
    return this.environment;
  }

  public getEnvironmentVariable(key:string):string|undefined{
      if (this.environment.get(key)){
          return this.environment.get(key);
      }else{
          console.error('No such variable in defaults');
      }
  }

  public setEnvironmentVariable(key:string, value:string){
    if (this.environment.has(key)){
        if (value !== undefined || value !==""){
            console.log('set variable');
            this.environment.set(key, value);
            Environment.writeEnvironment(this.name, this.environment);
        }else{
            console.error(chalk.red('ERROR: variable can not be empty!'));
        }
    }else{
        console.error(chalk.red('ERROR: Unkown variable ´'+key+'´'));
    }
  }
} 
class ProjectStatus {
  private static xclHome = os.homedir + "/AppData/Roaming/xcl";
  private static stateFileName = "";
  private project: Project;
  private statusConfig: any; 
  
  constructor(project:Project){
    this.project = project;
    if (!fs.existsSync(ProjectStatus.xclHome + '/' + this.project.getName() + '.yaml')){
      this.statusConfig ={
        xcl: {
          version: "Release 1.0",
          workspace: project.getWorkspace(),
          users: {},
          dependencies: {}
        },
      };
      ProjectStatus.stateFileName = ProjectStatus.xclHome + '/' + this.project.getName() + '.yaml';
    }else{
      ProjectStatus.stateFileName = ProjectStatus.xclHome + '/' + this.project.getName() + '.yaml';
      this.statusConfig=this.deserialize();
    }
  }

  public hasChanged():boolean{
    this.statusConfig=this.deserialize();
    if(this.statusConfig.xcl.hash==Md5.hashStr(this.project.getConfig()).toString()){
      return false;
    }else{
      return true;
    }
  }

  public updateDependencyStatus(feature:ProjectFeature){
    if(!this.statusConfig.xcl.dependencies || !this.statusConfig.xcl.dependencies[feature.getName()]){
      console.log('ADD TO STATUS FILE!');
      this.statusConfig.xcl.dependencies[feature.getName()]={};
      this.statusConfig.xcl.dependencies[feature.getName()].version=feature.getReleaseInformation();
      console.log(yaml.stringify(this.statusConfig));
    }else if(this.statusConfig.xcl.dependencies[feature.getName()]){
      console.log('UPDATE IN STATUS FILE!');
      this.statusConfig.xcl.dependencies[feature.getName()].version=feature.getReleaseInformation();
    }
    this.serialize();
  }

  public updateUserStatus(){
    this.statusConfig.xcl.users.schema_app      = this.project.getName()+"_app";
    this.statusConfig.xcl.users.schema_logic    = this.project.getName()+"_logic";
    this.statusConfig.xcl.users.schema_data     = this.project.getName()+"_data";
    this.statusConfig.xcl.users.user_deployment = this.project.getName()+"_depl";
    this.serialize();
  }
  
  public updateStatus(){
    this.statusConfig.xcl.hash = Md5.hashStr(this.project.getConfig()).toString();
    this.serialize();
  }

  //Checks wether the dependency is already installed in the correct version
  public checkDependency(feature: ProjectFeature):boolean{
    this.statusConfig=this.deserialize();
    if (this.statusConfig.xcl.dependencies &&
        this.statusConfig.xcl.dependencies[feature.getName()] &&
        this.statusConfig.xcl.dependencies[feature.getName()].version == feature.getReleaseInformation()){
        return true;
    }else{
      return false;
    }
  }

  public checkUsers(){
    this.statusConfig=this.deserialize();
    if (!this.statusConfig.xcl.users.schema_app || !this.statusConfig.xcl.users.schema_logic || !this.statusConfig.xcl.users.schema_data || !this.statusConfig.xcl.users.user_deployment ){
        return false;
    }else{
      return true;
    }
  }

  public serialize(){
    try {
      fs.writeFileSync(ProjectStatus.stateFileName,yaml.stringify(this.statusConfig));
    }catch(err){
      console.log(err);
    }
  }

  private deserialize():any{
    let conf:string
    let confObject;
    try {
      conf = fs.readFileSync(ProjectStatus.stateFileName).toString();      
    } catch (err) {
      if (err.code === 'ENOENT') {        
        return 'File not found!';
      } else {
        throw err;
      }
      
    }

    return yaml.parse(conf);
  }

  public setFeatureStatus(featureName: string, installed: boolean){
    this.project.getFeatures().get(featureName)?.setInstalled(installed);
  }
}