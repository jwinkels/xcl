//Imports
import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as os from "os";
import { Project } from "./Project";
import { ProjectNotFoundError } from "./errors/ProjectNotFoundError";
import chalk from 'chalk'
const Table = require('cli-table')

//Implementation in Singleton-Pattern because there is no need for multiple instances of the ProjectManager!
export class ProjectManager {  
  public static projectYMLfile: string = "projects.yml";

  private static manager: ProjectManager;
  private static xclHome = os.homedir + "/AppData/Roaming/xcl";
  // private static project: Project;
  private static projectsYaml: yaml.ast.Document;
  private static projectsJson: any;

  private constructor() {
    // read projects
    ProjectManager.projectsYaml = yaml.parseDocument(fs.readFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile).toString());

    // convert to json of create an empty definition
    ProjectManager.projectsJson = ProjectManager.projectsYaml.toJSON() || { projects: {} };

    // what else belongs to PM?
  }

  /**
   * return Singelton-Instance of PM
   */
  static getInstance() {
    if (!ProjectManager.manager) {
      ProjectManager.manager = new ProjectManager();
    }
    return ProjectManager.manager;
  }

  /**
   * returns Project, when defined. Otherwise raises an exception
   *
   * @param projectName name of project
   */
  public getProject(projectName: string): Project {
    if (ProjectManager.projectsJson.projects && ProjectManager.projectsJson.projects[projectName]) {
      let projectJSON = ProjectManager.projectsJson.projects[projectName];
      return new Project(projectName, projectJSON.path, false);
    } else {
      throw new ProjectNotFoundError(`project ${projectName} not found`);
    }
  }

  /**
   * return Project, when found otherwise creates it
   * @param projectName name of project
   */
  public createProject(projectName: string): Project {
    // check if not allready defined
    let project;
    try {
      project = this.getProject(projectName);
      console.log(projectName + " allready created. Look @: " + project.getPath());
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        // start to create the project
        console.log(projectName + " is to be created in: " + process.cwd());
        project = new Project(projectName, process.cwd() + "/" + projectName, true);

        this.addProjectToGlobalConfig(project);
      } else {
        // undefined error. what happened?
        throw err;
      }
    }

    return project;
  }

  private addProjectToGlobalConfig(project: Project) {
    ProjectManager.projectsJson.projects[project.getName()] = project.toJSON();    
    fs.writeFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile, yaml.stringify(ProjectManager.projectsJson));
  }


  public removeProject(projectName: string, path: boolean, database: boolean) {
    // check if not allready defined
    let project;
    try {
      project = this.getProject(projectName);
      
      // remove from 
      this.removeProjectFromGlobalConfig(project);

      // todo remove from path?
      if (path) {
        fs.removeSync(project.getPath());
        console.log(`Path ${project.getPath()} removed`);
      }
      // todo remove from db?

    } catch (err) {
      // undefined error. what happened?
      throw err;      
    }
  }

  private removeProjectFromGlobalConfig(project: Project) {
    delete ProjectManager.projectsJson.projects[project.getName()];
    fs.writeFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile, yaml.stringify(ProjectManager.projectsJson));
    console.log(`Project ${project.getName()} removed`);
  }

  public getProjects():Project[] {
  
    let projects:Project[] = [];

    Object.keys(ProjectManager.projectsJson.projects).forEach(function(projectName) {
      let projectJSON = ProjectManager.projectsJson.projects[projectName];
      projects.push(new Project(projectName, projectJSON.path, false));
    });

    return projects;
  }

  public listProjects() {
    const table = new Table({
      head: [        
        chalk.blueBright('name'),
        chalk.blueBright('path'),
        chalk.redBright('status')
      ]
    });
    
    const projects:Project[] = ProjectManager.getInstance().getProjects();
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      table.push([ project.getName(), project.getPath(), project.getErrorText() ]);
    }

    console.log(table.toString());
  }
}
