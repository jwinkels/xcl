import { ProjectManager } from './ProjectManager';
import * as fs from "fs-extra"
import { DBHelper } from './DBHelper';
import { Md5 } from 'ts-md5';
import { Environment } from './Environment';

export class Application{

    public static installApplication(projectName:string,connection:string, password:string, ords:string){
        let path = "";
        let installFileList:Map<string,string>;
        installFileList=new Map();

        let baseFolderApex = "/apps/apex/";
        let projectPath    = ProjectManager.getInstance().getProject(projectName).getPath();
        let baseUrlIp      = connection.substr(0,connection.indexOf(':'));
  
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
                            ProjectManager.getInstance().getProject(projectName).getWorkspace() + " " +
                            appId +" "+
                            ProjectManager.getInstance().getProject(projectName).getName().toUpperCase()+"_APP" + " "+
                            ords + " " + projectName;
                installFileList.set(projectPath + baseFolderApex + file,
                                      script);
              }
            }
        });
  
        installFileList.forEach((script, path)=>{
          let conn=DBHelper.getConnectionProps(ProjectManager.getInstance().getProject(projectName).getUsers().get('APP')?.getName(),
                                      password,
                                      connection);
          DBHelper.executeScriptIn(conn, script, path);
        });
      }

    public static generateCreateWorkspaceFile(projectName:string, workspace:string){
        let path=ProjectManager.getInstance().getProject(projectName).getPath()+'/db/.setup/workspaces';
        let filename = path+'/create_'+workspace+'.sql'

        if(!fs.pathExistsSync(path)){
            fs.mkdirSync(path);
        }

        let script =      "@.env.sql" + "\n" +
                          "@&XCLBIN/scripts/create_workspace.sql "+
                          workspace + " "+
                          ProjectManager.getInstance().getProject(projectName).getName().toUpperCase()+"_APP";

        if(!fs.existsSync(filename)){
          fs.writeFileSync(filename,script);
        }
    }

    public static generateSQLEnvironment(projectName:string, xclHomePath:string){
      let path=ProjectManager.getInstance().getProject(projectName).getPath()+'/db/.setup/workspaces';
      let filename = path + '/.env.sql';

      
      if(!fs.pathExistsSync(path)){
        fs.mkdirSync(path);
      }

      let script  = 'define XCLBIN = \'';
      if (xclHomePath.indexOf(' ')){
        script =  script + '"' + xclHomePath + '"\'';
      }else{
        script = script + xclHomePath;
      }

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