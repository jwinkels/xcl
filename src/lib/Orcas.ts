import { injectable } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './ProjectFeature';
import * as fs from "fs-extra"
import { ProjectManager } from './ProjectManager';
import { Project } from './Project';
import cli from 'cli-ux';
import { ShellHelper } from "./ShellHelper";
import { DBHelper } from './DBHelper';
import { Application } from './Application';
import { Git } from "./Git";
import { Logger } from "./Logger";
import AdmZip = require("adm-zip");

const ps = require("ps-node");
@injectable()
export class Orcas implements DeliveryMethod{
    public install(feature:ProjectFeature, projectPath:string, singleSchema:boolean){

      let featurePath:string = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
      let projectName:string = ProjectManager.getInstance().getProjectNameByPath(projectPath);

        if (!singleSchema){
          fs.copyFileSync(featurePath + '/schema/build.gradle', projectPath + '/db/' + projectName + '_app/build.gradle');
          fs.copyFileSync(featurePath + '/schema/build.gradle', projectPath + '/db/' + projectName + '_logic/build.gradle');
          fs.copyFileSync(featurePath + '/schema/build.gradle', projectPath + '/db/' + projectName + '_data/build.gradle');

          fs.copyFileSync(featurePath + '/gradlew', projectPath + '/db/' + projectName + '_app/gradlew');
          fs.copyFileSync(featurePath + '/gradlew', projectPath + '/db/' + projectName + '_logic/gradlew');
          fs.copyFileSync(featurePath + '/gradlew', projectPath + '/db/' + projectName + '_data/gradlew');

          fs.copyFileSync(featurePath + '/gradlew.bat', projectPath + '/db/' + projectName + '_app/gradlew.bat');
          fs.copyFileSync(featurePath + '/gradlew.bat', projectPath + '/db/' + projectName + '_logic/gradlew.bat');
          fs.copyFileSync(featurePath + '/gradlew.bat', projectPath + '/db/' + projectName + '_data/gradlew.bat');

          fs.copySync(featurePath+'/gradle/', projectPath + '/db/' + projectName + '_app/gradle/');
          fs.copySync(featurePath+'/gradle/', projectPath + '/db/' + projectName + '_logic/gradle/');
          fs.copySync(featurePath+'/gradle/', projectPath + '/db/' + projectName + '_data/gradle/');

          /*fs.removeSync(projectPath+'/db/'+ projectName + '_data/tables_ddl');
          fs.removeSync(projectPath+'/db/'+ projectName + '_logic/tables_ddl');
          fs.removeSync(projectPath+'/db/'+ projectName + '_app/tables_ddl');*/
        }else{
          fs.copyFileSync(featurePath + '/app/build.gradle', projectPath + '/db/' + projectName + '/build.gradle');
          fs.copyFileSync(featurePath + '/gradlew',          projectPath + '/db/' + projectName + '/gradlew');
          fs.copyFileSync(featurePath + '/gradlew.bat',      projectPath + '/db/' + projectName + '/gradlew.bat');
          fs.copySync    (featurePath + '/gradle/',          projectPath + '/db/' + projectName + '/gradle/');

          //fs.removeSync(projectPath + '/db/'+ projectName + '/tables_ddl');
        }
      fs.removeSync(featurePath);

      feature.setInstalled(true);
    }

    public async deploy(projectName:string, connection:string, password:string, schemaOnly: boolean, ords: string, silentMode:boolean, version:string, mode:string, schema:string|undefined, nocompile:boolean|undefined){

      let project=ProjectManager.getInstance().getProject(projectName);
      let gradleStringData  = "gradlew deploy -Ptarget="   + connection + " -Pusername=" + project.getUsers().get('DATA')?.getConnectionName()  + " -Ppassword=" + password + " -Pnocompile="+ nocompile +" -Pmode=" + mode + " --continue";
      let gradleStringLogic = "gradlew deploy -Ptarget="   + connection + " -Pusername=" + project.getUsers().get('LOGIC')?.getConnectionName() + " -Ppassword=" + password + " -Pnocompile="+ nocompile +" -Pmode=" + mode + " --continue";
      let gradleStringApp   = "gradlew deploy -Ptarget="   + connection + " -Pusername=" + project.getUsers().get('APP')?.getConnectionName()   + " -Ppassword=" + password + " -Pnocompile="+ nocompile +" -Pmode=" + mode + " --continue";
      let path:string = "";
      let buildZip:AdmZip;
      if (version){
        if (fs.pathExistsSync(`${project.getPath()}/dist/${version}.zip`)){
          buildZip = new AdmZip(`${project.getPath()}/dist/${version}.zip`);
          buildZip.extractAllTo(`${project.getPath()}/dist/${version}`,true);
          path = `${project.getPath()}/dist/${version}`;
        }else{
          path = project.getPath();
        }
      }else{
        path = project.getPath();
      }

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
          console.log("Deploy Schema");
          await this.hook(schema, "pre", projectName, connection, password, project);
          await this.deploySchema(gradleString, project, schema);
          await this.hook(schema, "post", projectName, connection, password, project);
          let invalids = await DBHelper.getInvalidObjects(DBHelper.getConnectionProps(project.getUsers().get(schema.toUpperCase())?.getConnectionName(),password,connection));
          project.getLogger().getLogger().log("info",`Number of invalid objects: ${invalids.length}`);
          invalids.forEach((element: { name: string; type: string; }) => {
            project.getLogger().getLogger().log("info",`${element.name} (${element.type})`);
          });

          if (project.getMode() === Project.MODE_SINGLE && !schemaOnly){
            Application.installApplication(projectName, connection, password, ords);
          }
        }

      }else{
        if (silentMode){
          cli.action.start('Deploy...');
          this.silentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly, path).then((success)=>{
            if(success){
              if(path.includes('dist')){
                this.cleanUp(path);
              }
              cli.action.stop('done');
            }else{
              this.cleanUp(path);
              cli.action.stop('failed');
            }
          });
        }else{
          this.unsilentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly, path).finally(()=>{
            this.cleanUp(path);
          });
        }
      }
    }

    private async hook(schema:string, type:string, projectName:string, connection:string, password:string, project:Project):Promise<void>{

      let conn:any;
      cli.action.start(`${type}-${schema}-hooks: ...` );
      project.getLogger().getFileLogger().log("info",`${type}-${schema}-hooks`);
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

        fs.readdirSync(project.getPath() + "/db/.hooks/")
              .filter( f => (
                            f.toLowerCase().substr(0, f.indexOf('_', f.indexOf('_', 0) + 1)).includes( type.toLowerCase() ) &&
                            f.toLowerCase().substr(0, f.indexOf('_', f.indexOf('_', 0) + 1)).includes( schema.toLowerCase() )
                          )
                     )
              .forEach(file=>{
                DBHelper.executeScriptIn(conn,
                                         file,
                                         project.getPath() + "/db/.hooks/",
                                         project.getLogger()
                                        );
              });
        cli.action.stop('done');
    }

    public async unsilentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean, executePath:string):Promise<boolean>{
      let _this = this;
      return new Promise(async (resolve, reject)=>{
        await _this.hook("data", "pre", projectName, connection, password, project);
        project.getLogger().getFileLogger().log("info",`pre-data-hooks done`);
        await ShellHelper.executeScript(gradleStringData, executePath + "/db/" + project.getName() + "_data", true, project.getLogger())
        await _this.hook("data", "post", projectName, connection, password, project);
        project.getLogger().getFileLogger().log("info",`post-data-hooks done`);
        let proceed:boolean = await cli.confirm('Proceed with ' + projectName.toUpperCase() + '_LOGIC? (y/n)');
        if (proceed){
          await _this.hook("logic","pre",projectName, connection, password, project);
          ShellHelper.executeScript(gradleStringLogic, executePath + "/db/" + project.getName() + "_logic", true, project.getLogger());
          _this.hook("logic", "post", projectName, connection, password, project);
          proceed = await cli.confirm('Proceed with ' + projectName.toUpperCase() + '_APP? (y/n)');
            if (proceed){
              await _this.hook("app", "pre", projectName, connection, password, project);
              await ShellHelper.executeScript(gradleStringApp, executePath + "/db/" + project.getName() + "_app", true, project.getLogger());
              await _this.hook("app", "post", projectName, connection, password, project);
              if (!schemaOnly){
                Application.installApplication(projectName, connection, password, ords);
              }
              await _this.hook("app","finally",projectName, connection, password, project);
              await _this.hook("logic","finally",projectName, connection, password, project);
              await _this.hook("data","finally",projectName, connection, password, project);
              project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
              resolve(true);

            }else{
              project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
              resolve(true);
            }
        }else{
          project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
          resolve(true);
        }
      });
    }

    public async silentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean, executePath:string):Promise<boolean>{
      return new Promise((resolve, reject)=>{
        let _this = this;
        _this.hook("data","pre",projectName, connection, password, project).then(()=>{
          ShellHelper.executeScript(gradleStringData, executePath+"/db/"+project.getName()+"_data", false, project.getLogger())
          .then(function(){
            _this.hook("data","post",projectName, connection, password, project);
            _this.hook("logic","pre",projectName, connection, password, project);
            ShellHelper.executeScript(gradleStringLogic, executePath+"/db/"+project.getName()+"_logic", false, project.getLogger())
              .then(function(){
                _this.hook("logic","post",projectName, connection, password, project);
                _this.hook("app","pre",projectName, connection, password, project);
                ShellHelper.executeScript(gradleStringApp, executePath+"/db/"+project.getName()+"_app", false, project.getLogger())
                  .then(()=>{
                    _this.hook("app","post", projectName, connection, password, project).then(()=>{
                      if (!schemaOnly){
                        Application.installApplication(projectName, connection, password, ords);
                      }
                      _this.hook("app", "finally", projectName, connection, password, project);
                      _this.hook("logic", "finally", projectName, connection, password, project);
                      _this.hook("data", "finally", projectName, connection, password, project);
                      project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
                      resolve(true);
                    })
                  });
              })
          });
        });
      });
    }

    public async deploySchema(gradleString:string, project:Project, schema:string):Promise<boolean>{
      return new Promise(async (resolve, reject)=>{
        if(project.getMode()===Project.MODE_MULTI){
          await ShellHelper.executeScript(gradleString, project.getPath() + "/db/" + project.getName() + "_" + schema, true, project.getLogger());
          resolve(true);
        }else{
          await ShellHelper.executeScript(gradleString, project.getPath() + "/db/" + project.getName(), true, project.getLogger());
          resolve(true);
        }
      });
    }

    public async build(projectName:string, version:string, mode:string, commit:string|undefined){
      let release  = ProjectManager.getInstance().getProject(projectName).getVersion();
      let project:Project = ProjectManager.getInstance().getProject(projectName);

      //ProjectManager.getInstance().getProject(projectName).setVersion(version);
      let path = "";
      let buildZip:AdmZip = await this.patch(version, project, mode, commit!);
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
        }
      });

      buildZip.addLocalFolder(project.getPath() + "/rest", "rest");

      buildZip.writeZip(project.getPath()+ "/" + version + ".zip");
      fs.moveSync(project.getPath()+ "/" + version + ".zip",project.getPath()+ "/dist/" + version + ".zip");
    }


    async patch(version:string, project:Project, mode:string, commit:string):Promise<AdmZip>{
      let fileMap:Map<string,string> = new Map();
      let fileList:string[] = await Git.getChangedFiles(mode, commit, project.getName());
      let tablesPath:string = "";
      let buildZip = new AdmZip();

      if (project.getMode()===Project.MODE_MULTI){
        tablesPath = `db/${project.getName()}_data/tables/`;
      }else{
        tablesPath = `db/${project.getName()}/tables/`;
      }
       //Orcas needs all tables to be part of every Build, or else there will be errors in build
       let tables:string = (await ShellHelper.executeScript('ls *.sql -A1', project.getPath()+`/${tablesPath}`,false, new Logger(project.getPath()))).result;
       if (tables.includes('\n')){
         let tableList:string[] = tables.split('\n');
         for(let i=0; i<tableList.length; i++){
           fileList.push(tablesPath + tableList[i]);
         }
       }

       for(let i=0; i<fileList.length; i++){
         if(fileList[i]!='' && !fileList[i].endsWith('/')){
           fileMap.set(fileList[i],fileList[i]);
         }
       }

       for await (const iterator of fileMap.keys()) {
         if(fs.pathExistsSync(iterator)){
          let path = iterator.substring(0, iterator.lastIndexOf('/'));
          console.log(`${iterator} .. added to build!`);
          buildZip.addLocalFile(iterator, path);
         }
       }

       for await (const schema of ["data","logic","app"]) {
         for await (const file of ["build.gradle","gradlew","gradlew.bat"]) {
          if (project.getMode()===Project.MODE_MULTI){
              if (!fileMap.has(`db/${project.getName()}_${schema}/${file}`)){
                buildZip.addLocalFile(`db/${project.getName()}_${schema}/${file}`, `db/${project.getName()}_${schema}/`);
              }
          }else{
            if (!fileMap.has(`db/${project.getName()}/${file}`)){
              buildZip.addLocalFile(`db/${project.getName()}/${file}`, `db/${project.getName()}/`);
            }
          }
         }
         buildZip.addLocalFolder(`db/${project.getName()}_${schema}/gradle/`,`db/${project.getName()}_${schema}/gradle`)
        }

       return buildZip;
    }

    private cleanUp(path:string){
      if(path.includes('dist')){
        try{
          cli.action.start('Cleaning up...');
          ps.lookup({command: 'java', arguments: 'org.gradle.launcher.daemon.bootstrap.GradleDaemon'}, function(err:string, resultList:any ) {
              for (const process of resultList) {
                ps.kill(process.pid);
              }
              fs.removeSync(path);
              cli.action.stop('done');
          });
        }catch(error){
          console.log(error);
        }
      }
    }

    public remove(feature:ProjectFeature, projectPath:string, singleSchema:boolean)    : void {
      let projectName:string = ProjectManager.getInstance().getProjectNameByPath(projectPath);

        if (!singleSchema){
          fs.removeSync(projectPath + '/db/' + projectName + '_app/build.gradle');
          fs.removeSync(projectPath + '/db/' + projectName + '_logic/build.gradle');
          fs.removeSync(projectPath + '/db/' + projectName + '_data/build.gradle');

          fs.removeSync(projectPath + '/db/' + projectName + '_app/gradlew');
          fs.removeSync(projectPath + '/db/' + projectName + '_logic/gradlew');
          fs.removeSync(projectPath + '/db/' + projectName + '_data/gradlew');

          fs.removeSync(projectPath + '/db/' + projectName + '_app/gradlew.bat');
          fs.removeSync(projectPath + '/db/' + projectName + '_logic/gradlew.bat');
          fs.removeSync(projectPath + '/db/' + projectName + '_data/gradlew.bat');

          fs.removeSync(projectPath + '/db/' + projectName + '_app/gradle/');
          fs.removeSync(projectPath + '/db/' + projectName + '_logic/gradle/');
          fs.removeSync(projectPath + '/db/' + projectName + '_data/gradle/');
        }else{
          fs.removeSync(projectPath + '/db/' + projectName + '/build.gradle');
          fs.removeSync(projectPath + '/db/' + projectName + '/gradlew');
          fs.removeSync(projectPath + '/db/' + projectName + '/gradlew.bat');
          fs.removeSync(projectPath + '/db/' + projectName + '/gradle/');
        }
      feature.setInstalled(false);
    }
}