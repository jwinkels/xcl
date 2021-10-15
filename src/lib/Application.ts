import { ProjectManager } from './ProjectManager';
import * as fs from "fs-extra"
import { DBHelper } from './DBHelper';
import { Md5 } from 'ts-md5';
import { Utils } from './Utils';
import { Project } from './Project';
import { Git } from './Git';

export class Application{

    public static installApplication(projectName:string,connection:string, password:string, ords:string){
        let installFileList:Map<string,string>;
        installFileList=new Map();

        let baseFolderApex = "/apps/apex/";
        let project = ProjectManager.getInstance().getProject(projectName);
        let projectPath    = project.getPath();
        let baseUrlIp      = connection.substr(0,connection.indexOf(':'));
        let schema         = project.getMode() === Project.MODE_MULTI ? project.getName().toUpperCase()+"_APP" : project.getName();
  
        //Read apex-folder and find the correct file
        fs.readdirSync( projectPath + baseFolderApex).forEach(file=>{
            console.log(file);
            if(fs.statSync(projectPath + baseFolderApex + file).isDirectory()){
              if(fs.existsSync(projectPath + baseFolderApex + file + "/install.sql")){
                //Get Application ID
                    // In Zukunft: project.getApplicationId()
                
                //Jetzt mal noch über auslesen der ID vom pfad
                let appId = file.substr(1,file.length-1);
                //Copy PreInstall File - to this location
                fs.copySync(__dirname+"/scripts/pre_install_application.sql",
                                projectPath + baseFolderApex + file + "/pre_install_application.sql");

                let script= projectPath + baseFolderApex + file + "/pre_install_application.sql " + 
                            project.getWorkspace() + " " +
                            appId + " " +
                            schema + " " +
                            ords + " " + 
                            projectName;

                installFileList.set(projectPath + baseFolderApex + file,
                                      script);
              }
            }else{
              if (file.includes('.sql')){
                let appId = file.substr(1,file.indexOf('.') - 2);
                let script = projectPath + baseFolderApex + file + 
                                project.getWorkspace() + " " +
                                appId + " " +
                                schema + " " +
                                ords + " " + 
                                projectName;
                installFileList.set(projectPath + baseFolderApex + file, script);
              }
            }
        });
        
        installFileList.forEach((script, path)=>{
          let conn=DBHelper.getConnectionProps(project.getUsers().get('APP')?.getConnectionName(),
                                      password,
                                      connection);
          DBHelper.executeScriptIn(conn, script, path, project.getLogger());
        });
      }

    public static generateCreateWorkspaceFile(projectName:string, workspace:string){
        let path=ProjectManager.getInstance().getProject(projectName).getPath()+'/db/.setup/workspaces';
        let filename = path+'/create_'+workspace+'.sql'

        if(!fs.pathExistsSync(path)){
            fs.mkdirSync(path);
        }

        let script =      "@.env.sql" + "\n" +
                          '@'+Utils.enwrapInQuotes('&XCLBIN/scripts/create_workspace.sql')+' '+
                          workspace + " "+
                          ProjectManager.getInstance().getProject(projectName).getUsers().get('APP')?.getName();

        if(!fs.existsSync(filename)){
          fs.writeFileSync(filename,script);
        }
    }

    public static generateSQLEnvironment(projectName:string, xclHomePath:string){
      let project:Project = ProjectManager.getInstance().getProject(projectName);
      let path=project.getPath()+'/db/.setup/workspaces';
      let filename = path + '/.env.sql';

      Git.addToGitignore(project.getPath(), filename);
      
      if(!fs.pathExistsSync(path)){
        fs.mkdirSync(path);
      }

      let script  = 'define XCLBIN = ';

      script = script + xclHomePath;

      if(!fs.existsSync(filename) ||  
        Md5.hashStr(script) != Md5.hashStr(fs.readFileSync(filename).toString())
      ){
        fs.writeFileSync(filename,script);
      }
    }

    public static removeSQLEnvironmentFile(projectName:string){
      let path=ProjectManager.getInstance().getProject(projectName).getPath()+'/db/.setup/workspaces';
      let filename = path + '/.env.sql';
      if(fs.existsSync(filename)){
        fs.unlinkSync(filename);
      }
    }


} 