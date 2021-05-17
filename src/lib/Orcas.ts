import { injectable } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './ProjectFeature';
import * as fs from "fs-extra"
import { ProjectManager } from './ProjectManager';
import { Project } from './Project';
import cli from 'cli-ux';
import {ShellHelper} from "./ShellHelper";
import { DBHelper } from './DBHelper';
import { Application } from './Application';

@injectable()
export class Orcas implements DeliveryMethod{
    public install(feature:ProjectFeature, projectPath:string){
        let featurePath = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
        fs.copyFileSync(featurePath+'/app/build.gradle',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_app/build.gradle');
        fs.copyFileSync(featurePath+'/logic/build.gradle',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_logic/build.gradle');
        fs.copyFileSync(featurePath+'/data/build.gradle',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_data/build.gradle');
        
        fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_app/gradlew');
        fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_logic/gradlew');
        fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_data/gradlew');

        fs.copyFileSync(featurePath+'/gradlew.bat',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_app/gradlew.bat');
        fs.copyFileSync(featurePath+'/gradlew.bat',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_logic/gradlew.bat');
        fs.copyFileSync(featurePath+'/gradlew.bat',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_data/gradlew.bat');
        
        
        fs.copySync(featurePath+'/gradle/',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_app/gradle/');
        fs.copySync(featurePath+'/gradle/',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_logic/gradle/');
        fs.copySync(featurePath+'/gradle/',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_data/gradle/');

        fs.removeSync(projectPath+'/db/'+ ProjectManager.getInstance().getProjectNameByPath(projectPath) + '_data/tables_ddl');
        fs.removeSync(featurePath);
        
        feature.setInstalled(true);
    }

    public deploy(projectName:string, connection:string, password:string, schemaOnly: boolean, ords: string, silentMode:boolean, version:string, mode:string){
      
      let project=ProjectManager.getInstance().getProject(projectName);
      let gradleStringData = "gradlew deployData -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('DATA')?.getConnectionName() + " -Ppassword=" + password + " --continue";
      let gradleStringLogic = "gradlew deployLogic -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('LOGIC')?.getConnectionName() + " -Ppassword=" + password + " --continue";
      let gradleStringApp = "gradlew deployApp -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('APP')?.getConnectionName() + " -Ppassword=" + password + " --continue";
      /*
        Pre-Deploy
      */

      //TODO: Was ist wenn ich das für mehrere Schemata machen möchte
      let conn=DBHelper.getConnectionProps(project.getUsers().get('APP')?.getConnectionName(),
                                    password,
                                    connection);

      fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/db/.hooks/").filter(f=>f.toLowerCase().includes("pre_")).forEach(file=>{
        DBHelper.executeScriptIn(conn, file, ProjectManager.getInstance().getProject(projectName).getPath() + "/db/.hooks/");
      });

      /*
        Pre-Deploy Hook End
      */

      /*
        Deploy Start
      */

      if (silentMode){
        this.silentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly);
      }else{
        this.unsilentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly);
      }

      /*
      ShellHelper.executeScript(gradleStringData, project.getPath()+"/db/"+project.getName()+"_data")
        .then(function(){
          ShellHelper.executeScript(gradleStringLogic, project.getPath()+"/db/"+project.getName()+"_logic")
            .then(function(){
              ShellHelper.executeScript(gradleStringApp, project.getPath()+"/db/"+project.getName()+"_app")
                .then(()=>{
                    if (!schemaOnly){
                      Application.installApplication(projectName, connection, password, ords);
                    }
                })
            })
        });
      */
      /*
        Deploy End
      */
    
      /*
        Post-Deploy Hook Start
      */
        
      fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/db/.hooks/").filter(f=>f.toLowerCase().includes("post_")).forEach(file=>{
        DBHelper.executeScriptIn(conn, file, ProjectManager.getInstance().getProject(projectName).getPath() + "/db/.hooks/");
      });

      /*
        Post-Deploy Hook End
      */
    }


    public unsilentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean){
      ShellHelper.executeScript(gradleStringData, project.getPath()+"/db/"+project.getName()+"_data")
      .then(function(){
        cli.confirm('Proceed with '+projectName.toUpperCase()+'_LOGIC? (y/n)').then(function(proceed){
          if (proceed){
            ShellHelper.executeScript(gradleStringLogic, project.getPath()+"/db/"+project.getName()+"_logic")
              .then(function(){
                cli.confirm('Proceed with '+projectName.toUpperCase()+'_APP? (y/n)').then(function(proceed){
                  if (proceed){
                    ShellHelper.executeScript(gradleStringApp, project.getPath()+"/db/"+project.getName()+"_app")
                    .then(()=>{
                        if (!schemaOnly){
                          Application.installApplication(projectName, connection, password, ords);
                        }
                    })
                  }
                })
              })
          }
        })
      });
    }

    public silentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean){
      ShellHelper.executeScript(gradleStringData, project.getPath()+"/db/"+project.getName()+"_data")
        .then(function(){
          ShellHelper.executeScript(gradleStringLogic, project.getPath()+"/db/"+project.getName()+"_logic")
            .then(function(){
              ShellHelper.executeScript(gradleStringApp, project.getPath()+"/db/"+project.getName()+"_app")
                .then(()=>{
                  if (!schemaOnly){
                    Application.installApplication(projectName, connection, password, ords);
                  }
                })
            })
        });
    }

    public deploySchema(){
      //TODO: Implement single Schema Deploy
    }

    public build(projectName:string, version:string){
      let release  = ProjectManager.getInstance().getProject(projectName).getVersion();
      ProjectManager.getInstance().getProject(projectName).setVersion(version);
      let path = "";
      //Read apex-folder and find the correct file
      fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/").forEach(file=>{
        if ( fs.statSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file).isDirectory() ){
          if(file.startsWith('f')){
            //If Application was exportet with Split-Option
            if(fs.existsSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/application/create_application.sql")){
              path = ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/application/create_application.sql";
            }
            //If Application was exportet with SplitFlat-Option
            else if(fs.existsSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/create_application.sql")){
              path = ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/create_application.sql";
            }

          }
        }else{
          if(file.startsWith('f')){
            path = ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file;
          }
        }
  
        if(path != ""){
          let createApp = fs.readFileSync(path);
  
          if(createApp.toString().search("p_flow_version=>'" + release + "'") > 0){
            let newCreateApp = createApp.toString().replace("p_flow_version=>'" + release + "'","p_flow_version=>'" + version + "'");
            fs.writeFileSync(path, newCreateApp);
          }else{
            if(createApp.toString().search("p_flow_version=>'Release 1.0'") > 0){
              let newCreateApp = createApp.toString().replace("p_flow_version=>'" + release + "'","p_flow_version=>'" + version + "'");
              fs.writeFileSync(path, newCreateApp);
            }else{
              console.log("Replacement String was not found, Version-Number could not be set automatically!");
            }
          }
        }else{
          console.log("File could not be found!");
        }
      });     
      
    }
    /*
    private static installApplication(projectName:string,connection:string, password:string){
      let path = "";
      let installFileList:Map<string,string>;
      installFileList=new Map();

      //Read apex-folder and find the correct file
      fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/").forEach(file=>{
          console.log(file);
          if(fs.statSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file).isDirectory()){
            if(fs.existsSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/install.sql")){
              //Get Application ID
                  // In Zukunft: ProjectManager.getInstance().getProject(projectName).getApplicationId()
              
              //Jetzt mal noch über auslesen der ID vom pfad
              let appId = file.substr(1,file.length-1);
              //Copy PreInstall File - to this location
              fs.copySync(__dirname+"/scripts/pre_install_application.sql",
                          ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/pre_install_application.sql");
              let script=ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/pre_install_application.sql " + 
                          ProjectManager.getInstance().getProject(projectName).getWorkspace() + " " +
                          appId +" "+
                          ProjectManager.getInstance().getProject(projectName).getName().toUpperCase()+"_APP";
              installFileList.set(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file,
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
    */
}