import { ProjectManager } from './ProjectManager';
import * as fs from "fs-extra"
import { DBHelper } from './DBHelper';

export class Application{

    public static installApplication(projectName:string,connection:string, password:string){
        let path = "";
        let installFileList:Map<string,string>;
        installFileList=new Map();

        let baseFolderApex = "/applications/apex/";
        let projectPath    = ProjectManager.getInstance().getProject(projectName).getPath();
  
        //Read apex-folder and find the correct file
        fs.readdirSync( projectPath + baseFolderApex).forEach(file=>{
            console.log(file);
            if(fs.statSync(projectPath + baseFolderApex + file).isDirectory()){
              if(fs.existsSync(projectPath + baseFolderApex + file + "/install.sql")){
                //Get Application ID
                    // In Zukunft: ProjectManager.getInstance().getProject(projectName).getApplicationId()
                
                //Jetzt mal noch über auslesen der ID vom pfad
                let appId = file.substr(1,file.length-1);
                //Copy PreInstall File - to this location
                fs.copySync(__dirname+"/scripts/pre_install_application.sql",
                                projectPath + baseFolderApex + file + "/pre_install_application.sql");

                let script= projectPath + baseFolderApex + file + "/pre_install_application.sql " + 
                            projectPath + " " +
                            appId +" "+
                            ProjectManager.getInstance().getProject(projectName).getName().toUpperCase()+"_APP";
                installFileList.set(projectPath + baseFolderApex + file,
                                      script);
              }
            }
        });
  
        installFileList.forEach((script, path)=>{
          let conn=DBHelper.getConnectionProps(ProjectManager.getInstance().getProject(projectName).getUsers().get('APP')?.getName(),
                                      password,
                                      connection);
          console.log("About to execute: " + script + " in: " + path);
          DBHelper.executeScript(conn, __dirname+"/scripts/create_workspace.sql "+
                                          ProjectManager.getInstance().getProject(projectName).getWorkspace() + " "+
                                          ProjectManager.getInstance().getProject(projectName).getName().toUpperCase()+"_APP");
          DBHelper.executeScriptIn(conn, script, path);
        });
      }
} 