//Imports
import * as yaml from 'yaml';
import * as fs from 'fs-extra';
import * as os from 'os';
import { Project } from './Project';
import { dirname } from 'path';

//Implementation in Singleton-Pattern because there is no need for multiple instances of the ProjectManager!
export class ProjectManager {
    private static manager: ProjectManager;
    private static xclHome = os.homedir + '/AppData/Roaming/xcl';
    private static project:Project;
    private static projectsYaml:yaml.ast.Document;

    private constructor(){
        console.log(ProjectManager.xclHome); 
        ProjectManager.projectsYaml=yaml.parseDocument(
                                                fs.readFileSync(ProjectManager.xclHome+"/projects.yml").toString()
                                            );      
    }
    /**
     * returns the Instance of ProjectManager
     * @param project 
     */
    static getInstance(projectName: string){
        if (!ProjectManager.manager) {
            ProjectManager.manager = new ProjectManager();
        }
        let json=ProjectManager.projectsYaml.toJSON();
        if (json.projects && json.projects[projectName]){
            let projectJSON=json.projects[projectName];
            ProjectManager.project = new Project(projectName, projectJSON.path);
        }else{
            console.log(projectName+' is to be created in: '+process.cwd());
            ProjectManager.project = new Project(projectName, process.cwd());
            json.projects[ProjectManager.project.getName()]=ProjectManager.project.toJSON();
            console.log(json.projects);
           // fs.writeFileSync(ProjectManager.xclHome+"/projects.yml",yaml.)
        }
        return ProjectManager.manager;
        
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
            fs.readFileSync(__dirname+"/config/directories.yml").toString()
        );
        
        dirsJson = parsedDirs.toJSON(); 

        this.createDirectoryPath(dirsJson,"/");

    }

    public loadProjectConfiguration(){
        let config=yaml.parse(fs.readFileSync(ProjectManager.project.getPath()+'/xcl.yml').toString());
        //console.log(config);
    }
}