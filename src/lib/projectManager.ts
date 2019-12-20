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

    private createDirectoryPath(path:any,fullPath:string){
       if (path instanceof Array){
        for (let i = 0; i < path.length; i++) {
             this.createDirectoryPath(path[i],fullPath);
          }
       }else if (path instanceof Object){
        for(let i=0; i<Object.keys(path).length; i++){
            let objName=Object.keys(path)[i];
            this.createDirectoryPath(path[objName],fullPath+objName+'/');
        }
       } else{
           if (!fs.existsSync(ProjectManager.project.getPath()+fullPath+path)){
            fullPath=ProjectManager.project.getPath()+fullPath+path;
            fs.mkdirSync(fullPath,{recursive: true});
           }
           
       }
       
    }

    public createDirectoryStructure(){
        let dirsJson:JSON;
        let directories:string[]=[];

        let parsedDirs = yaml.parseDocument(
            fs.readFileSync("./config/directories.yml").toString()
        );
        
        dirsJson = parsedDirs.toJSON(); 

        this.createDirectoryPath(dirsJson,"/");

    }

    public loadProjectConfiguration(){
        let config=yaml.parse(fs.readFileSync(ProjectManager.project.getPath()+'/xcl.yml').toString());
        //console.log(config);
    }
}

//ProjectManager.getInstance("xxx").loadProjectConfiguration();

//console.log(ProjectManager.getInstance("pvslite").getProjectHome());
ProjectManager.getInstance("xxx").createDirectoryStructure();
//console.log(ProjectManager.getInstance("test").getProjectHome());