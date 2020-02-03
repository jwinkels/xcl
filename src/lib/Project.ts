import * as yaml from "yaml";
import * as fs from "fs-extra";
import { ProjectFeature } from './projectFeature';

export class Project {
  private name: string;
  private path: string;
  private errorText: string = '';
  private config: Object;
  private features:ProjectFeature[];

  constructor(name: string, path: string, create: boolean) {
    this.name = name;
    this.path = path;
    this.features = [];

    if (create) {
      this.config = this.initialzeConfig();

      this.createDirectoryStructure();
      this.writeConfig();
    } else {
      this.config = this.readConfig();      
      
    }
  }

  public getErrorText(): string {
    return this.errorText;
  }

  public getPath(): string {
    return this.path;
  }

  public getName(): string {
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
  }

  public writeConfig() {    
    fs.writeFileSync(this.getPath() + "/" + "xcl.yml", yaml.stringify(this.config));    
  }

  private initialzeConfig() {
    return {
      xli: {
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

  private readConfig() {
    let conf:string
    let confObject;

    try {
      conf = fs.readFileSync(this.getPath() + "/xcl.yml").toString();      
    } catch (err) {
      if (err.code === 'ENOENT') {        
        conf = yaml.stringify({xli: {
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

  public addFeature(feature:ProjectFeature){
    this.features.push(feature);
  }
}
