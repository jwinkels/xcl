//Imports
import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import * as os from 'os';
import { Project } from './Project';

//Implementation in Singleton-Pattern because there is no need for multiple instances of the ProjectManager!
class ProjectManager {
    private static manager: ProjectManager;
    private static xclHome = os.homedir + '/AppData/Roaming/xcl';
    private static project:Project;
    private static projectsYaml:yaml.ast.Document;

    private constructor(){
        console.log("Baue Project Manager!!"); 
        ProjectManager.projectsYaml=yaml.parseDocument(
                                                fs.readFileSync(ProjectManager.xclHome+"/projects.yml").toString()
                                            );      
    }
    /**
     * returns the Instance of ProjectManager
     * @param project 
     */
    static getInstance(project: string){
        if (!ProjectManager.manager) {
            ProjectManager.manager = new ProjectManager();
        }
        let json=ProjectManager.projectsYaml.toJSON();
        if (json.projects[project]){
            let projectJSON=json.projects[project];
            ProjectManager.project = new Project(project, projectJSON.path);
            return ProjectManager.manager;
        }else{
            throw new Error("Cannot read Project '"+project+"' ");
        }
        
    }

    public getProjectHome():string{
        return ProjectManager.project.getPath();
    }

    public loadProjectConfiguration(){
        let config=yaml.parse(fs.readFileSync(ProjectManager.project.getPath()+'/xli.yml').toString());
        console.log(config);
    }
}

ProjectManager.getInstance("xxx").loadProjectConfiguration();

console.log(ProjectManager.getInstance("pvslite").getProjectHome());
//console.log(ProjectManager.getInstance("test").getProjectHome());