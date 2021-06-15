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
    public install(feature:ProjectFeature, projectPath:string, singleSchema:boolean){
        let featurePath = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
          if (!singleSchema){
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
          }else{
            fs.copyFileSync(featurePath+'/app/build.gradle',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '/build.gradle');
            fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '/gradlew');
            fs.copyFileSync(featurePath+'/gradlew.bat',projectPath + '/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '/gradlew.bat');
            fs.copySync(featurePath+'/gradle/',projectPath+'/db/' + ProjectManager.getInstance().getProjectNameByPath(projectPath) + '/gradle/');
            fs.removeSync(projectPath+'/db/'+ ProjectManager.getInstance().getProjectNameByPath(projectPath) + '/tables_ddl');
          }
        fs.removeSync(featurePath);
        
        feature.setInstalled(true);
    }

    public deploy(projectName:string, connection:string, password:string, schemaOnly: boolean, ords: string, silentMode:boolean, version:string, mode:string, schema:string|undefined){
      
      let project=ProjectManager.getInstance().getProject(projectName);
      let gradleStringData = "gradlew deployData -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('DATA')?.getConnectionName() + " -Ppassword=" + password + " --continue";
      let gradleStringLogic = "gradlew deployLogic -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('LOGIC')?.getConnectionName() + " -Ppassword=" + password + " --continue";
      let gradleStringApp = "gradlew deployApp -Ptarget=" + connection + " -Pusername=" + project.getUsers().get('APP')?.getConnectionName() + " -Ppassword=" + password + " --continue";
      
      if (schema){
        let gradleString:string = "";
        switch (schema){
          case "data": 
            gradleString = gradleStringData;
            break;
          case "logic":
            gradleString = gradleStringLogic;
            break;
          case "app":
            gradleString = gradleStringApp;
            break;
          default:
            gradleString = "";
            break;
        }
        
        if (gradleString){
          this.hook(schema, "pre", projectName, connection, password, project);
          this.deploySchema(gradleString, project, schema);
          this.hook(schema, "post", projectName, connection, password, project);
        }

      }else{
        if (silentMode){
          cli.action.start('Deploy...');
          this.silentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly).then((success)=>{
            if(success){
              cli.action.stop('done');
            }else{
              cli.action.stop('failed');
            }
          });
        }else{
          this.unsilentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly);
        }
      }
    }

    private hook(schema:string, type:string, projectName:string, connection:string, password:string, project:Project):void{
     
      let conn:any;
      cli.action.start(`${type}-${schema}-hooks: ...` );
      switch (schema.toLowerCase()){
        case 'data':
          conn=DBHelper.getConnectionProps(project.getUsers().get('DATA')?.getConnectionName(),
                                          password,
                                          connection);
          break;
        case 'logic':
          conn=DBHelper.getConnectionProps(project.getUsers().get('LOGIC')?.getConnectionName(),
                                          password,
                                          connection);
          break;
        case 'app':
          conn=DBHelper.getConnectionProps(project.getUsers().get('APP')?.getConnectionName(),
                                          password,
                                          connection);
          break;
        }

        fs.readdirSync(ProjectManager.getInstance().getProject(projectName).getPath() + "/db/.hooks/")
              .filter( f => ( 
                            f.toLowerCase().substr(0, f.indexOf('_', f.indexOf('_', 0) + 1)).includes( type.toLowerCase() ) && 
                            f.toLowerCase().substr(0, f.indexOf('_', f.indexOf('_', 0) + 1)).includes( schema.toLowerCase() ) 
                          ) 
                     )
              .forEach(file=>{
                DBHelper.executeScriptIn(conn, 
                                         file, 
                                         ProjectManager.getInstance().getProject(projectName).getPath() + "/db/.hooks/"
                                        );
              });
        cli.action.stop('done');
    }

    public unsilentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean){
      let _this = this;
      _this.hook("data","pre",projectName, connection, password, project);
      ShellHelper.executeScript(gradleStringData, project.getPath()+"/db/"+project.getName()+"_data", true)
      .then(function(){
        _this.hook("data","post",projectName, connection, password, project);
        cli.confirm('Proceed with '+projectName.toUpperCase()+'_LOGIC? (y/n)').then(function(proceed){
          if (proceed){
            _this.hook("logic","pre",projectName, connection, password, project);
            ShellHelper.executeScript(gradleStringLogic, project.getPath()+"/db/"+project.getName()+"_logic", true)
              .then(function(){
                _this.hook("logic","post",projectName, connection, password, project);
                cli.confirm('Proceed with '+projectName.toUpperCase()+'_APP? (y/n)').then(function(proceed){
                  if (proceed){
                    _this.hook("app","pre",projectName, connection, password, project);
                    ShellHelper.executeScript(gradleStringApp, project.getPath()+"/db/"+project.getName()+"_app", true)
                    .then(()=>{
                      _this.hook("app","post",projectName, connection, password, project);
                        if (!schemaOnly){
                          Application.installApplication(projectName, connection, password, ords);
                        }
                        _this.hook("app","finally",projectName, connection, password, project);
                        _this.hook("logic","finally",projectName, connection, password, project);
                        _this.hook("data","finally",projectName, connection, password, project);
                    })
                  }
                })
              })
          }
        })
      });
    }

    public async silentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean):Promise<boolean>{
      return new Promise((resolve, reject)=>{
        let _this = this;
        _this.hook("data","pre",projectName, connection, password, project);
        ShellHelper.executeScript(gradleStringData, project.getPath()+"/db/"+project.getName()+"_data", false)
        .then(function(){
          _this.hook("data","post",projectName, connection, password, project);
          _this.hook("logic","pre",projectName, connection, password, project);
          ShellHelper.executeScript(gradleStringLogic, project.getPath()+"/db/"+project.getName()+"_logic", false)
            .then(function(){
              _this.hook("logic","post",projectName, connection, password, project);
              _this.hook("app","pre",projectName, connection, password, project);
              ShellHelper.executeScript(gradleStringApp, project.getPath()+"/db/"+project.getName()+"_app", false)
                .then(()=>{
                  _this.hook("app","post",projectName, connection, password, project);
                  if (!schemaOnly){
                    Application.installApplication(projectName, connection, password, ords);
                  }
                  _this.hook("app","finally",projectName, connection, password, project);
                  _this.hook("logic","finally",projectName, connection, password, project);
                  _this.hook("data","finally",projectName, connection, password, project);  
                  resolve(true);
                })
            })
        });
      });
    }

    public deploySchema(gradleString:string, project:Project, schema:string){
      if(project.getMode()==='multi'){
        ShellHelper.executeScript(gradleString, project.getPath() + "/db/" + project.getName() + "_" + schema, true);
      }else{
        console.log(gradleString, project.getPath() + "/db/" + project.getName());
        ShellHelper.executeScript(gradleString, project.getPath() + "/db/" + project.getName(), true);
      }
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
}