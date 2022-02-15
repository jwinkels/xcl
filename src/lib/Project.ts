import * as yaml from "yaml";
import * as fs from "fs-extra";
import chalk from 'chalk'
import { ProjectFeature } from './ProjectFeature';
import { FeatureManager } from './FeatureManager';
import { Schema } from './Schema';
import  * as os from 'os';
import { Environment } from './Environment';
import { Md5 } from 'ts-md5/dist/md5';
import {Operation} from './Operation';
import { Logger } from "./Logger";
import { Git } from "./Git";


export class Project {
  static MODE_SINGLE: string = "single";
  static MODE_MULTI:  string = "multi";
  static SETUP_DIR: string   = "_setup";

  private name: string;                           //Project-Name
  private path: string; 	                        //Project-Home
  private errorText = '';                        //Individual Error-Messages
  private config: any;                            //YAML-Structure that contains all project-configuration
  private features: Map<string, ProjectFeature>;  //Map to save the added features
  private users: Map<string, Schema>;              //Map for Project User-List
  private status: ProjectStatus;
  private environment:Map<string, {value:string, required:boolean}>;
  private logger:Logger;
  private directories:string;
  private _depot_path: string = '';                            // if something is deployed, that is the path



  constructor(name: string, path: string, workspaceName:string , create: boolean, singleSchema:boolean=false) {
    this.name = name;
    this.path = path;
    this.logger = new Logger(path);

    if (create) {
      this.config = this.initialzeConfig(workspaceName, singleSchema);
      this.writeConfig();
      this.features = new Map();
      this.users = new Map();
      this.status = new ProjectStatus(this);
      this.directories = this.status.getDirectoryHash();
      this.createDirectoryStructure(singleSchema);
      Git.addToGitignore(this.getPath(),'.xcl');
      
      
      this.status.serialize()
      this.environment = Environment.initialize(this.name, this, singleSchema ? 'app' : '');
    } else {
      this.config = this.readConfig();
      this.status = new ProjectStatus(this);
      this.directories = this.status.getDirectoryHash();
      this.createDirectoryStructure(this.getMode()=== Project.MODE_MULTI ? false : true);
      this.name   = this.config.xcl.project;
      this.features = this.getFeatures();
      this.users = this.getUsers();
      this.environment = Environment.initialize(this.name, this, singleSchema ? 'app' : '');
      this.depotPath = this.config.xcl.depot_path;
      process.chdir(this.getPath());
    }

  }

  public getLogger():Logger{
    return this.logger;
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

  public setVersion(version:string):void{
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

  public setWorkspace(workspaceName:string):void{
    if(!this.config.xcl.workspace){
      this.config=this.readConfig();
    }

    this.config.xcl.workspace=workspaceName;
    this.writeConfig();
  }

  public setMode(mode:string):void{
    if(!this.config.xcl.mode){
      this.config = this.readConfig();
    }

    this.config.xcl.mode = mode;
    this.writeConfig();
  }

  public getMode():string{
    if(this.config){
      return this.config.xcl.mode ? this.config.xcl.mode : Project.MODE_MULTI ;
    }else{
      this.config=this.readConfig();
      return this.config.xcl.mode;
    }
  }

  public isMultiSchema():boolean {
    return this.getMode() === Project.MODE_MULTI
  }

  public toJSON(): any {
    return { path: this.getPath() };
  }

  public get depotPath(): string {
    return this._depot_path;
  }

  public set depotPath(value: string) {
    this._depot_path = value;

    this.config.xcl.depot_path = value;
    this.writeConfig();
  }


  private createDirectoryPath(path: any, fullPath: string):void {
    if (path instanceof Array) {
      for (let i = 0; i < path.length; i++) {
        this.createDirectoryPath(path[i], fullPath);
      }
    } else if (path instanceof Object) {
      for (let i = 0; i < Object.keys(path).length; i++) {
        const objName = Object.keys(path)[i];
        this.createDirectoryPath(path[objName] != null ? path[objName] : "", fullPath + objName + "/");
      }
    } else {
      if (fullPath.includes(':projectName')){
        fullPath = fullPath.replace(':projectName',this.getName());
      }

      if (!fs.existsSync(this.getPath() + fullPath + path)) {
        fullPath = this.getPath() + fullPath + path;
        fs.mkdirSync(fullPath, { recursive: true });
        fs.createFileSync(fullPath + '/.gitkeep');
      }
    }
  }

  private createDirectoryStructure(singleSchema:boolean):void {
    let parsedDirs:any;

    if (!singleSchema){
      parsedDirs = yaml.parseDocument(fs.readFileSync(__dirname + "/config/directories.yml").toString());
      if ( this.directories !== Md5.hashStr(yaml.stringify(parsedDirs)).toString()){
        this.createDirectoryPath(parsedDirs.toJSON(), "/");
        this.updateDirectoryStructure();
        this.status.setDirectoryHash(Md5.hashStr(yaml.stringify(parsedDirs)).toString());
      }

    }else{

      parsedDirs = yaml.parseDocument(fs.readFileSync(__dirname + "/config/directories_single_schema.yml").toString());
      if ( this.directories !== Md5.hashStr(yaml.stringify(parsedDirs)).toString()){
        this.createDirectoryPath(parsedDirs.toJSON(), "/");
        this.updateDirectoryStructure();
        this.status.setDirectoryHash(Md5.hashStr(yaml.stringify(parsedDirs)).toString());
      }

    }

    if (!fs.existsSync(this.getPath() + "/readme.md")){
      fs.copySync(__dirname + "/config/readme.md", this.getPath() + "/readme.md");
    }
  }

  private updateDirectoryStructure():void{

    function copyFromTo(src:string, target:string, move:boolean=false ){
      let files:string[] = [];
      if (fs.existsSync(src)) {
        files = fs.readdirSync(src);
        files.forEach((file)=>{
          if (move){
            if(file !== '.gitkeep'){
              fs.moveSync(src + '/' + file, target +'/' + file);
            }
          }else{
            fs.copySync(src + '/' + file, target +'/' + file); 
          }
        });
      }
    }

    //Change init, pre, post- (dml, ddl) => ddl, dml - (init, pre, post)
    this.getUsers().forEach(async (user)=> {
      if (user.getName()){
        let dirPath = this.path + '/db/' + user.getName().toLowerCase();
        let relPath = '/db/' + user.getName().toLowerCase();
        copyFromTo(dirPath+'/init/dml',dirPath+'/dml/init');
        copyFromTo(dirPath+'/pre/dml',dirPath+'/dml/pre');
        copyFromTo(dirPath+'/post/dml',dirPath+'/dml/post');
        
        await Git.addToGitignore(this.path, relPath+'/init/dml');
        await Git.addToGitignore(this.path, relPath+'/pre/dml');
        await Git.addToGitignore(this.path, relPath+'/post/dml');

        copyFromTo(dirPath+'/init/ddl',dirPath+'/ddl/init');
        copyFromTo(dirPath+'/pre/ddl',dirPath+'/ddl/pre');
        copyFromTo(dirPath+'/post/ddl',dirPath+'/ddl/post');

        await Git.addToGitignore(this.path, relPath+'/init/ddl');
        await Git.addToGitignore(this.path, relPath+'/pre/ddl');
        await Git.addToGitignore(this.path, relPath+'/post/ddl');

        copyFromTo(dirPath+'/ddl/pre', dirPath+'/ddl/patch/pre', true);
        copyFromTo(dirPath+'/ddl/post', dirPath+'/ddl/patch/post', true);
        copyFromTo(dirPath+'/dml/pre', dirPath+'/dml/patch/pre', true);
        copyFromTo(dirPath+'/dml/post', dirPath+'/dml/patch/post', true);
        copyFromTo(dirPath+'/sources/views', dirPath+'/views', true);
        copyFromTo(dirPath+'/tables_ddl', dirPath+'/tables/tables_ddl', true);
      }
    });
    
    
  }

  public writeConfig():void {
    fs.writeFileSync(this.getPath() + "/" + "xcl.yml", yaml.stringify(this.config));
  }

  private initialzeConfig(workspaceName: string, singleSchema:boolean):any {
    if (!singleSchema){
      return {
        xcl: {
          project: this.getName(),
          description: "XCL- Projekt " + this.getName(),
          version: "Release 1.0",
          workspace: workspaceName,
          mode: Project.MODE_MULTI,
          users: {
            schema_app: this.getName() + "_app",
            schema_logic: this.getName() + "_logic",
            schema_data: this.getName() + "_data",
            user_deployment: this.getName() + "_depl",
            user_sys: "sys",
          },
        },
      };
    }else{
      return {
        xcl: {
          project: this.getName(),
          description: "XCL- Projekt " + this.getName(),
          version: "Release 1.0",
          workspace: workspaceName,
          mode: Project.MODE_SINGLE,
          users: {
            schema_app: this.getName(),
            user_sys: "sys",
          },
        },
      };
    }
  }

  public reloadConfig():void{
    this.config = this.readConfig();
  }

  private readConfig():any{
    let conf:string

    try {
      conf = fs.readFileSync(this.getPath() + "/xcl.yml").toString();
    } catch (err:any) {
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
  public addFeature(feature:ProjectFeature):any{
    let dependencyConf:any = "";
    //Do not add the Feature if it is already in dependency list or if deployment method has already been configured
    if ( ! this.features.has(feature.getName()) && !(feature.getType()==="DEPLOY" && this.hasDeployMethod())){
      this.config=this.readConfig();
      this.features.set(feature.getName(),feature);
      if(!this.config.xcl.dependencies){
        this.config.xcl.dependencies=[];
        //this.status.updateStatus();
      }

      //DEPLOY-Feature using the existing users to connect to the database and deploy the objects
      if(feature.getType()==="DEPLOY"){
        dependencyConf = {
              name: feature.getName(),
              version: feature.getReleaseInformation(),
              installed: false,
              type: feature.getType()
          };

      }else{
        dependencyConf = {
                name: feature.getName(),
                version: feature.getReleaseInformation(),
                //installed: feature.getInstalled(),
                type: feature.getType(),
                user:{
                    name: feature.getUser().getConnectionName(),
                    pwd: feature.getUser().getPassword()
                    }
                };
      }
      this.config.xcl.dependencies.push(dependencyConf);
      this.writeConfig();
      return true;
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

  public addSetupStep(file:string, path:string, hash:string):void{

    

    if (!this.config.xcl.setup){
      this.config.xcl.setup=[];
    }
    const newStep = {name: file, path: path, hash: ""};

    const stepIndex = this.config.xcl.setup.findIndex(
                      (
                        e: { name: string; path: string; }
                      ) => e.name == newStep.name && e.path == newStep.path
                    );
    const projectStatus:ProjectStatus = this.getStatus();

    if(stepIndex==-1){
      this.config.xcl.setup.push({name: newStep.name, path: newStep.path});
      projectStatus.addSetupFile(newStep);
      projectStatus.addToChanges('SETUP');
    }else{
      if (hash !== projectStatus.getSetupFileHash(file, path)){
        console.log('File (' + file +') has changed!');
        projectStatus.addToChanges('SETUP');
      }
    }
  }

  private hasDeployMethod():boolean{
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

  public removeFeature(feature:ProjectFeature):void{
    if (this.features.has(feature.getName())){
      this.config=this.readConfig();
      this.features.delete(feature.getName());
      if(!this.config.xcl.dependencies){
        console.log('No dependencies!');
        this.config.xcl.dependencies=[];
      }

      this.config.xcl.dependencies = this.config.xcl.dependencies.filter((obj: { name: string; version: string; installed: boolean; user: { name: string; pwd: string; }; }) => obj.name !== feature.getName())

      this.writeConfig();
    }else{
      console.log(chalk.yellowBright('WARNING: Dependency is not defined to this Project! No dependency removed!'));
    }
  }

  //INFO: Read all Features from configuration and write it to feature-Map < String, ProjectFeature >
  public getFeatures():Map<string,ProjectFeature>{
    const features: Map<string, ProjectFeature> = new Map<string, ProjectFeature>();
    const featureManager = FeatureManager.getInstance();
    this.config=this.readConfig();

    if (this.config.xcl?.dependencies){
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: boolean; type:string; user:any}) => {
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

  public getFeaturesOfType(type:string):Map<string,ProjectFeature>{
    const features: Map<string,ProjectFeature> = new Map<string,ProjectFeature>();
    this.config = this.readConfig();
    if (this.config.xcl?.dependencies){
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: boolean; type:string; user:any}) => {
        if ( element.type == type ){
          features.set(element.name,(FeatureManager.getInstance().getProjectFeature(element.name,element.version, element.user.name, element.user.pwd, element.installed) ! ));
        }
      });
    }else{
      return features;
    }
    return features;
  }

  public updateFeature(feature:ProjectFeature):void{
    if (this.features.has(feature.getName())){

      this.config=this.readConfig();
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: boolean}) => {

        if(element.name===feature.getName()){
          element.version=feature.getReleaseInformation();

          if(feature.getType() === 'DEPLOY'){
            element.installed = true;
          }

        }
      });

      this.writeConfig();
    }
  }

  public getUsers():Map<string,Schema>{
    this.config = this.readConfig();
    this.users  = new Map<string,Schema>();

    if(this.config.xcl?.users){
      const users=this.config.xcl?.users;
      const proxy= new Schema({name: users.user_deployment, password:"", proxy:undefined});
      this.users.set('APP',new Schema({name: users.schema_app, password:"", proxy: this.getMode() === Project.MODE_MULTI ? proxy : undefined}));
      this.users.set('LOGIC',new Schema({name: users.schema_logic, password:"", proxy:proxy}));
      this.users.set('DATA',new Schema({name: users.schema_data, password:"", proxy:proxy}));
    }

    return this.users;
  }

  public getUserNames():string[]{
    let userNames:string[]=[];
    if (this.isMultiSchema()){
      this.users.forEach(schema=>{
          userNames.push(schema.getName().toUpperCase())
      });
    }else{
      userNames.push(this.getUsers().get('APP')!.getName().toUpperCase());
    }
    return userNames;
  }

  public getConfig():any{
    return this.config;
  }

  public getStatus():ProjectStatus{
    return this.status;
  }

  public getEnvironment():Map<string, {value:string, required:boolean}>{
    return this.environment;
  }

  public setEnvironment(envMap: Map<string, {value:string, required:boolean}>):void{
    this.environment = envMap;
  }

  public getEnvironmentVariable(key:string):string|undefined{
      if (this.environment.get(key)){
          return this.environment.get(key)?.value;
      }else{
          console.error('No such variable in defaults');
      }
  }

  public setEnvironmentVariable(key:string, value:string|undefined, reset:boolean=false){

    if (this.environment.has(key)){

        if (!reset){
          if (value && value !==""){
              Environment.setVariable(key, value, this.environment);
              console.log(chalk.green('OK'));
          }else{
              process.stderr.write(chalk.red('ERROR: variable can not be empty!'));
          }
        }else{
          Environment.setVariable(key, value!, this.environment);
          process.stdout.write(chalk.green('OK'));
        }
        Environment.writeEnvironment(this.name, this.environment);
    }else{
        console.error(chalk.red('ERROR: Unkown variable ´'+key+'´'));
    }
  }
}

class ProjectStatus {
  private static stateFileName:string = "";
  private static xclHome = os.homedir + "/AppData/Roaming/xcl/";
  private project: Project;
  private statusConfig: any;
  private changeList:Map<string, boolean>;

  constructor(project:Project){
    this.project = project;
    this.changeList = new Map<string, boolean>();

    this.changeList.set('FEATURE',false);
    this.changeList.set('SETUP',false);
    this.changeList.set('USER',false);

    if (!fs.existsSync(this.project.getPath() + '/.xcl/state.yml')){

      if (fs.existsSync(this.project.getPath() + '/.xcl/' + this.project.getName() + '.yaml')){
        fs.renameSync(this.project.getPath() + '/.xcl/' + this.project.getName() + '.yaml', this.project.getPath() + '/.xcl/state.yml');
        //fs.removeSync(this.project.getPath() + '/.xcl/' + this.project.getName() + '.yaml');
      }

      if(fs.existsSync(ProjectStatus.xclHome + this.project.getName() + '.yaml')){
        fs.moveSync(ProjectStatus.xclHome + this.project.getName() + '.yaml', this.project.getPath() + '/.xcl/' + this.project.getName() + '.yaml');
      }else{
        if (!fs.existsSync(this.project.getPath() + '/.xcl/state.yml')){
          this.statusConfig ={
            xcl: {
              version: "Release 1.0",
              workspace: project.getWorkspace(),
              users: {},
              hash: "",
              dependencies: {},
              setup: []
            }
          };

          ProjectStatus.stateFileName = this.project.getPath() + '/.xcl/state.yml';
        }
      }
    }

    ProjectStatus.stateFileName = this.project.getPath() + '/.xcl/state.yml';
    this.statusConfig=this.deserialize();
  }

  public addToChanges(change:string){
    this.changeList.set(change, true);
  }

  public hasChanged():boolean{
    this.changeList=new Map<string, boolean>();
    this.project.reloadConfig();
    this.statusConfig=this.deserialize();
    this.checkSetup(`./db/${Project.SETUP_DIR}`);

    let projectConfig = this.project.getConfig();
    delete projectConfig.xcl["version"];

    if( this.statusConfig.xcl.hash == Md5.hashStr( yaml.stringify( projectConfig ) ).toString()
          &&
        !this.changeList.get("SETUP") ){
      return false;
    }else{
      return true;
    }
  }

  public checkSetup(path:string){
    fs.readdirSync(path).forEach(file=>{
      if(fs.lstatSync(path + '/' + file).isFile() && !file.startsWith(".")){
        const content = fs.readFileSync(path + '/' + file);
        const contentHash = Md5.hashStr(content.toString()).toString();
        this.project.addSetupStep(file, path, contentHash);
      }else{
        if(fs.lstatSync(path + '/' + file).isDirectory()){
          this.checkSetup(path + "/" + file);
        }
      }
    });

    //Write config only when SETUP-Directory has changes!
    if(this.changeList.get('SETUP')){
      this.project.writeConfig();
    }
  }

  public getChanges():Map<string, boolean>{
    return this.changeList;
  }

  public updateDependencyStatus(feature:ProjectFeature, removed:boolean=false){
    if (!removed){
      if(!this.statusConfig.xcl.dependencies || !this.statusConfig.xcl.dependencies[feature.getName()]){
        this.statusConfig.xcl.dependencies[feature.getName()]={};
        this.statusConfig.xcl.dependencies[feature.getName()].version=feature.getReleaseInformation();
        this.statusConfig.xcl.dependencies[feature.getName()].owner = feature.getOwner();
      }else if(this.statusConfig.xcl.dependencies[feature.getName()]){
        this.statusConfig.xcl.dependencies[feature.getName()].version=feature.getReleaseInformation();
      }
    }else{
      delete this.statusConfig.xcl.dependencies[feature.getName()];
    }

    this.serialize();
  }

  public updateUserStatus(){
    if(this.project.getMode()===Project.MODE_MULTI){
      this.statusConfig.xcl.users.schema_app      = this.project.getName()+"_app";
      this.statusConfig.xcl.users.schema_logic    = this.project.getName()+"_logic";
      this.statusConfig.xcl.users.schema_data     = this.project.getName()+"_data";
      this.statusConfig.xcl.users.user_deployment = this.project.getName()+"_depl";
    }else{
      this.statusConfig.xcl.users.schema_app      = this.project.getName();
    }
    this.serialize();
  }

  public updateStatus(){
    this.project.reloadConfig();
    this.statusConfig=this.deserialize();
    let projectConfig = this.project.getConfig();
    delete projectConfig.xcl["version"];
    this.statusConfig.xcl.hash = Md5.hashStr(yaml.stringify( projectConfig )).toString();
    this.serialize();
  }

  public setCommitId(commitId:string){
    this.statusConfig=this.deserialize();
    this.statusConfig.xcl['commit'] = commitId.replace(/[^a-zA-Z0-9]/g,'');
    this.serialize();
  }

  public getCommitId():string{
    this.statusConfig = this.deserialize();
    if(this.statusConfig.xcl.commit){
      return this.statusConfig.xcl.commit;
    }else{
      return '';
    }
  }

  public setVersion(version:string){
    this.statusConfig=this.deserialize();
    this.statusConfig.xcl['version'] = version;
    this.serialize();
  }

  public getVersion():string{
    this.statusConfig = this.deserialize();
    if(this.statusConfig.xcl.version){
      return this.statusConfig.xcl.version;
    }else{
      return '';
    }
  }

  //Checks wether the dependency is already installed in the correct version
  public checkDependency(feature: ProjectFeature):Operation{

    this.statusConfig=this.deserialize();
    if (this.statusConfig.xcl.dependencies &&
        this.statusConfig.xcl.dependencies[feature.getName()] &&
        this.statusConfig.xcl.dependencies[feature.getName()].version == feature.getReleaseInformation()){

              return Operation.NONE;

    }else if(this.statusConfig.xcl.dependencies &&
             !this.statusConfig.xcl.dependencies[feature.getName()]){

              this.addToChanges('FEATURE');
              return Operation.INSTALL;

    }else if(this.statusConfig.xcl.dependencies &&
            this.statusConfig.xcl.dependencies[feature.getName()] &&
            this.statusConfig.xcl.dependencies[feature.getName()].version != feature.getReleaseInformation()){

              this.addToChanges('FEATURE');
              return Operation.UPDATE;
    }else{
      throw Error("Error Checking Dependency, please Check your status-File for errors!");
    }
  }

  public getRemovedDependencies(){
    let features:Map<string,ProjectFeature> = new Map();
    this.statusConfig=this.deserialize();
    features = this.project.getFeatures();
      Object.keys(this.statusConfig.xcl.dependencies).forEach(key=>{
          if(!features.has(key)){
            console.log(chalk.yellow('WARNING: You have unused dependencies! (' + key + ')'));
          }
      });
  }

  public checkUsers(){
    this.statusConfig=this.deserialize();
    if (this.project.getMode()===Project.MODE_MULTI){
      if (!this.statusConfig.xcl.users.schema_app || !this.statusConfig.xcl.users.schema_logic || !this.statusConfig.xcl.users.schema_data || !this.statusConfig.xcl.users.user_deployment ){
          this.addToChanges('USER');
          return false;
      }else{
        return true;
      }
    }else{
      if (!this.statusConfig.xcl.users.schema_app){
        this.addToChanges('USER');
        return false;
      }else{
        return true;
      }
    }
  }

  public serialize(){
    try {
      fs.writeFileSync(ProjectStatus.stateFileName,yaml.stringify(this.statusConfig));
    }catch(err){
      console.log(err);
    }
  }

  protected deserialize():any{
    let conf = "";

    try {
      if(fs.existsSync(ProjectStatus.stateFileName)){
        conf = fs.readFileSync(ProjectStatus.stateFileName).toString();
      }else{
        return this.statusConfig;
      }
    } catch (err:any) {
      if (err.code === 'ENOENT') {
        return 'File not found!';
      } else {
        throw err;
      }

    }

    return yaml.parse(conf);
  }

  public getDependencyStatus(feature: ProjectFeature):boolean{
    if(this.statusConfig.xcl.dependencies &&
       this.statusConfig.xcl.dependencies[feature.getName()] &&
       this.statusConfig.xcl.dependencies[feature.getName()].version === feature.getReleaseInformation()
       ){
      return true;
    }else{
      return false;
    }
  }

  public setDirectoryHash(hash:string){
    this.statusConfig=this.deserialize();
    this.statusConfig.xcl.directoryHash = hash;
    this.serialize();
  }

  public getDirectoryHash():string{
    this.statusConfig=this.deserialize();
    if (this.statusConfig.xcl && this.statusConfig.xcl.directoryHash){
      return this.statusConfig.xcl.directoryHash;
    }else{
      return '';
    }
  }

  public addSetupFile(step:{name:string, path:string, hash:string}):void{
    if (!this.statusConfig.xcl.setup){
      this.statusConfig.xcl.setup=[];
    }

    const stepIndex = this.statusConfig.xcl.setup.findIndex(
                      (
                        e: { name: string; path: string; }
                      ) => e.name == step.name && e.path == step.path
                    );
    if(stepIndex==-1){
      this.statusConfig.xcl.setup.push(step);
      this.serialize();
    }
  }

  public getSetupFileHash(name:string, path:string):string{

    if (!this.statusConfig.xcl.setup){
      this.statusConfig.xcl.setup=[];
    }

    const stepIndex = this.statusConfig.xcl.setup.findIndex(
      (
        e: { name: string; path: string; }
      ) => e.name == name && e.path == path
    );

    if(stepIndex!=-1){
      return this.statusConfig.xcl.setup[stepIndex].hash;
    }else{
      this.statusConfig.xcl.setup.push({name: name, path: path, hash:""});
      this.serialize();
      return "";
    }
  }

  public updateSetupStep (file:string, path:string):void{
    try{
      const content = fs.readFileSync(path+'/'+file);
      const contentHash = Md5.hashStr(content.toString()).toString();
      const newStep = {name: file, path: path, hash: contentHash};

      const stepIndex = this.statusConfig.xcl.setup.findIndex(
        (
          e: { name: string; path: string; }
        ) => e.name == newStep.name && e.path == newStep.path
      );

      this.statusConfig.xcl.setup[stepIndex].hash=contentHash;
      this.serialize();
    }catch(error){
      console.log(error);
    }
  }
}