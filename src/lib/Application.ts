import { ProjectManager } from './ProjectManager';
import * as fs from "fs-extra";
import { DBHelper } from './DBHelper';
import { Md5 } from 'ts-md5';
import { Utils } from './Utils';
import { Project } from './Project';
import { Git } from './Git';

export class Application{

    public static installApplication(projectName:string,connection:string, password:string, ords:string){
        //Initialize variables
        let installFileList:Map<string,string> = new Map();
        const baseDirectoryApex                = "/apex/";
        const baseDirectoryOrds                = "/rest/modules";
        const project                          = ProjectManager.getInstance().getProject(projectName);
        const projectPath                      = project.getPath();
        const schema                           = project.getMode() === Project.MODE_MULTI ? project.getName().toUpperCase()+"_APP" : project.getName();

        //Read apex-directory and find the correct file
        fs.readdirSync( projectPath + baseDirectoryApex).forEach(file => {
            //If file is a directory
            if(fs.statSync(projectPath + baseDirectoryApex + file).isDirectory()){
              //If directory contains a file named 'install.sql'  - the application export is splitted
              if(fs.existsSync(projectPath + baseDirectoryApex + file + "/install.sql")){
                let appId  = Application.getAppId(file);
                //Copy PreInstall File - to this location
                fs.copySync(__dirname+"/scripts/pre_install_application.sql",
                            projectPath + baseDirectoryApex + file + "/pre_install_application.sql");

                let script = projectPath                        +           //absolute projectPath
                             baseDirectoryApex                  +           //apex directory
                             file                               +           //directory of application export (i.e.: f100)
                             "/pre_install_application.sql "    +           //script to execute 
                             project.getWorkspace()             + " " +     //FIRST ARGUMENT:   WORKSPACE_NAME
                             appId                              + " " +     //SECOND ARGUMENT:  APPLICATION_ID
                             schema                             + " " +     //THIRD ARGUMENT:   SCHEMA_NAME
                             ords                               + " " +     //FOURTH ARGUMENT:  ORDS_BASE_URL
                             projectName;                                   //FIFTH ARGUMENT:   PROJECT_NAME

                installFileList.set(projectPath + baseDirectoryApex + file,
                                      script);
              }
            }else{
              //TODO: test if this really works, arguments of pre_install-script are attached to the apex export script (that might be a problem)
              //If file is no directory the application is not splitted the export is then in the following format (f100, f1200,...)
              if (file.includes('.sql')){
                let appId  = Application.getAppId(file);
                let script = projectPath            +                      //absolute project path                 
                             baseDirectoryApex      +                      //apex directory
                             file                   +                      //the apex application export       
                             project.getWorkspace() + " " +                             
                             appId                  + " " +                             
                             schema                 + " " +                             
                             ords                   + " " +                             
                             projectName;                             
                installFileList.set(projectPath + baseDirectoryApex + file, script);
              }
            }
        });

        //Read ORDS-modules directory and find sql-files
        fs.readdirSync( projectPath + baseDirectoryOrds).forEach(file => {
          if(fs.statSync(projectPath + baseDirectoryOrds + file).isDirectory()){
              fs.readdirSync(projectPath + baseDirectoryOrds + file).forEach(sqlfile =>{
                if(sqlfile.includes('.sql')){
                  installFileList.set(projectPath + baseDirectoryOrds + file, sqlfile);
                }
              });
          }
        });

        //loop through the list of identified install scripts and execute them against the project-app-schema
        installFileList.forEach((script, path)=>{
          let conn = DBHelper.getConnectionProps(project.getUsers().get('APP')?.getConnectionName(), password, connection);
          if(conn){
            DBHelper.executeScriptIn(conn, script, path, project.getLogger());
          }
        });
      }

    //this function generates a script to create the workspace for the APEX application 
    public static generateCreateWorkspaceFile(projectName:string, workspace:string){
        let path     = ProjectManager.getInstance().getProject(projectName).getPath()+`/db/${Project.SETUP_DIR}/workspaces`;
        let filename = path+'/create_'+workspace+'.sql'

        if (! fs.existsSync(filename) ){
          //check if the directory structure already exists and create it if not
          if(!fs.pathExistsSync(path)){
              fs.mkdirSync(path);
          }

          //content of the generate workspace script
          let script = "@.env.sql" + "\n" +
                      '@'+Utils.enwrapInQuotes('&XCLBIN/scripts/create_workspace.sql')+' '+
                      workspace + " "+
                      ProjectManager.getInstance().getProject(projectName).getUsers().get('APP')?.getName();

          //write content to script-file if not exist   
          fs.writeFileSync(filename,script);
        }
    }

    public static generateSQLEnvironment(projectName:string, xclHomePath:string){
      //initialize variables
      const project:Project = ProjectManager.getInstance().getProject(projectName);
      const path            = `${project.getPath()}/db/${Project.SETUP_DIR}/workspaces`;
      const filename        = path + '/.env.sql';

      if(!fs.pathExistsSync(path)){
        fs.mkdirSync(path);
      }

      //content of '.env.sql'
      let script  = `define XCLBIN = ${xclHomePath}`;

      //if file not exists or script content differs
      if(!fs.existsSync(filename) ||
        Md5.hashStr(script) != Md5.hashStr(fs.readFileSync(filename).toString())
      ){
        fs.writeFileSync(filename,script);
      }

      //add file to gitignore
      Git.addToGitignore(project.getPath(), filename);
    }

    public static removeSQLEnvironmentFile(projectName:string){
      const path     =  ProjectManager.getInstance().getProject(projectName).getPath()+`/db/${Project.SETUP_DIR}/workspaces`;
      const filename =  path + '/.env.sql';
      
      if(fs.existsSync(filename)){
        fs.unlinkSync(filename);
      }
    }

    //read app id from path
    private static getAppId(filename:string):string{
      let result = filename.match("f[0-9]{3,}");
      if(result && result?.length == 1){
        return result[0].substring(1,result[0].length);
      }else{
        return "";
      }
    }


}