import * as yaml from "yaml";
import * as fs from "fs-extra";
import chalk from 'chalk'
import { ProjectFeature } from './ProjectFeature';
import { FeatureManager } from './FeatureManager';
import { Schema } from './Schema';
import { type } from 'os';
import { Feature } from './Feature';

export class Project {
  private name: string;
  private path: string;
  private errorText: string = '';
  private config: any;
  private features: Map<String, ProjectFeature>;
  private users: Map<String,Schema>;

  constructor(name: string, path: string, workspaceName:string , create: boolean) {
    this.name = name;
    this.path = path;
   

    if (create) {
      this.config = this.initialzeConfig(workspaceName);
      this.features=new Map();
      this.users=new Map();
      this.createDirectoryStructure();
      this.writeConfig();
    } else {
      this.config = this.readConfig();      
      this.features = this.getFeatures();
      this.users = this.getUsers();
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
    //Do not add the Feature if it is already in dependency list or if deployment method has already been configured 
    if ( ! this.features.has(feature.getName()) || !(feature.getType()==="DEPLOY" && this.hasDeployMethod())){  
      this.config=this.readConfig();
      this.features.set(feature.getName(),feature);
      if(!this.config.xcl.dependencies){
        this.config.xcl.dependencies=[];
      }

      //DEPLOY-Feature using the existing users to connect to the database and deploy the objects 
      if(feature.getType()==="DEPLOY"){
        this.config.xcl.dependencies.push({
          name: feature.getName(), 
          version: feature.getReleaseInformation(),
          installed: feature.getInstalled(),
          type: feature.getType()
          });
      }else{
        this.config.xcl.dependencies.push({
                name: feature.getName(), 
                version: feature.getReleaseInformation(),
                installed: feature.getInstalled(),
                type: feature.getType(),
                user:{
                    name: feature.getUser().getName(),
                    pwd: feature.getUser().getPassword()
                    }
                });
      }

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

  public getFeatures():Map<String,ProjectFeature>{
    let features: Map<String,ProjectFeature>=new Map<String,ProjectFeature>();
    this.config=this.readConfig();
    if (this.config.xcl?.dependencies){
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: Boolean; type:string; user:any}) => {
        switch(element.type){
          case "DB": { 
            features.set(element.name,(FeatureManager.getInstance().getProjectFeature(element.name,element.version, element.user.name, element.user.pwd, element.installed) ! )); 
            break;
          }
          case "DEPLOY": {
            features.set(element.name,(FeatureManager.getInstance().getProjectFeature(element.name,element.version, "", "", element.installed) ! )); 
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
    let features: Map<String,ProjectFeature>=new Map<String,ProjectFeature>();
    this.config=this.readConfig();
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
      this.config.xcl.dependencies.forEach((element: { name: string; installed: Boolean; }) => {
        if(element.name===feature.getName()){
          element.installed=feature.getInstalled();
        }
      });
      this.writeConfig();
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
}  