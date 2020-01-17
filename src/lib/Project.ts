import * as yaml from "yaml";
import * as fs from "fs-extra";

export class Project {
  private name: string;
  private path: string;
  private config: Object;

  constructor(name: string, path: string, exists: boolean) {
    this.name = name;
    this.path = path;

    if (exists) {
      this.config = this.readConfig();
    } else {
      this.config = this.initialzeConfig();

      this.createDirectoryStructure();
      this.writeConfig();
    }
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
    return yaml.parse(fs.readFileSync(this.getPath() + "/xcl.yml").toString());
  }
}
