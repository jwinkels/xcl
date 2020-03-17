import * as yaml from "yaml";
import * as fs from "fs-extra";
import chalk from 'chalk'
import { ProjectFeature } from './ProjectFeature';
import { FeatureManager } from './FeatureManager';

export class Project {
  private name: string;
  private path: string;
  private errorText: string = '';
  private config: any;
  private features: Map<String, ProjectFeature>;

  constructor(name: string, path: string, create: boolean) {
    this.name = name;
    this.path = path;
   

    if (create) {
      this.config = this.initialzeConfig();
      this.features=new Map();
      this.createDirectoryStructure();
      this.writeConfig();
    } else {
      this.config = this.readConfig();      
      this.features=this.getFeatures();
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
  }

  public writeConfig() {    
    fs.writeFileSync(this.getPath() + "/" + "xcl.yml", yaml.stringify(this.config));    
  }

  private initialzeConfig() {
    return {
      xcl: {
        project: this.getName(),
        description: "XCL- Projekt " + this.getName(),
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
    if ( ! this.features.has(feature.getName())){  
      this.config=this.readConfig();
      this.features.set(feature.getName(),feature);
      if(!this.config.xcl.dependencies){
        console.log('No dependencies!');
        this.config.xcl.dependencies=[];
      }

      this.config.xcl.dependencies.push({
                            name: feature.getName(), 
                            version: feature.getReleaseInformation(),
                            installed: feature.getInstalled(),
                            user:{
                                name: feature.getUser().getName(),
                                pwd: feature.getUser().getPassword()
                                }
                            });

      this.writeConfig();
    }else{
      console.log(chalk.yellowBright('WARNING: Dependency is already defined to this Project! No dependency added!'));
      console.log(chalk.blueBright('INFO: To Update the dependency use feature:update'));
    }
  }

  public removeFeature(feature:ProjectFeature){
    if (this.features.has(feature.getName())){  
      this.config=this.readConfig();
      this.features.delete(feature.getName());
      if(!this.config.xcl.dependencies){
        console.log('No dependencies!');
        this.config.xcl.dependencies=[];
      }

      this.config.xcl.dependencies.pop({
        name: feature.getName(), 
        version: feature.getReleaseInformation(),
        installed: feature.getInstalled(),
        user:{
            name: feature.getUser().getName(),
            pwd: feature.getUser().getPassword()
            }
    });

      this.writeConfig();
    }else{
      console.log(chalk.yellowBright('WARNING: Dependency is not defined to this Project! No dependency removed!'));
    }
  }

  public getFeatures():Map<String,ProjectFeature>{
    let features: Map<String,ProjectFeature>=new Map<String,ProjectFeature>();
    this.config=this.readConfig();
    if (this.config.xcl?.dependencies){
      this.config.xcl.dependencies.forEach((element: { name: string; version: string; installed: Boolean; user:any}) => {
        features.set(element.name,(FeatureManager.getInstance().getProjectFeature(element.name,element.version, element.user.name, element.user.pwd, element.installed) ! ));    
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
}  