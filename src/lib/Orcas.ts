import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './projectFeature';
import * as fs from "fs-extra"
import { ProjectManager } from './projectManager';
import { exec } from "child_process";
import {ShellHelper} from "./ShellHelper";
import { DBHelper } from './DBHelper';

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

        fs.removeSync(featurePath);
        feature.setInstalled(true);
    }

    public deploy(projectName:string, connection:string, password:string){
      
      let project=ProjectManager.getInstance().getProject(projectName);
      let gradleStringData = "gradlew deployData -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('DATA')?.getName() + " -Ppassword=" + password;
      let gradleStringLogic = "gradlew deployLogic -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('LOGIC')?.getName() + " -Ppassword=" + password;
      let gradleStringApp = "gradlew deployApp -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('APP')?.getName() + " -Ppassword=" + password;
      
      Promise.all([ShellHelper.executeScript(gradleStringData, project.getPath()+"/db/"+project.getName()+"_data"),
      ShellHelper.executeScript(gradleStringLogic, project.getPath()+"/db/"+project.getName()+"_logic"),
      ShellHelper.executeScript(gradleStringApp, project.getPath()+"/db/"+project.getName()+"_app")]).then(()=>{
        this.installApplication(projectName, connection, password);
      });
    }

    public build(projectName:string, version:string){
      let release  = ProjectManager.getInstance().getProject(projectName).getVersion();
      ProjectManager.getInstance().getProject(projectName).setVersion(version);
      let path = "";
      //Read apex-folder and find the correct file
      fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/").forEach(file=>{
        if ( fs.statSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file).isDirectory() ){
          if(file.startsWith('f')){
            //Split
            if(fs.existsSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/application/create_application.sql")){
              path = ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/application/create_application.sql";
            }
            //SplitFlat
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
            console.log("Replacement String was not found, Version-Number could not be set automatically!");
          }
        }else{
          console.log("File could not be found!");
        }
      });     
      
    }

    private installApplication(projectName:string,connection:string, password:string){
      let path = "";
      let installFileList:Map<string,string>;
      installFileList=new Map();
      //Read apex-folder and find the correct file
      fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/").forEach(file=>{
          console.log(file);
          if(fs.statSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file).isDirectory()){
            if(fs.existsSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/install.sql")){
              installFileList.set(ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file,
                                  ProjectManager.getInstance().getProject(projectName).getPath() + "/apex/" + file + "/install.sql");
            }
          }
      });

      installFileList.forEach((script, path)=>{
        let conn=DBHelper.getConnectionProps(ProjectManager.getInstance().getProject(projectName).getUsers().get('APP')?.getName(),
                                    password,
                                    connection);
        console.log("About to execute: " + script + " in: " + path);
        DBHelper.executeScriptIn(conn, script, path);
      });
    }
}