import { injectable } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './ProjectFeature';
import * as fs from "fs-extra";
import { ProjectManager } from './ProjectManager';
import { Project } from './Project';
import cli from 'cli-ux';
import { ShellHelper } from "./ShellHelper";
import { DBHelper } from './DBHelper';
import { Application } from './Application';
import { Git } from "./Git";
import { Logger } from "./Logger";
import yaml from 'yaml';
import os = require("os");
import AdmZip = require("adm-zip");
import chalk from 'chalk'
import inquirer = require('inquirer');
import { Schema } from "js-yaml";

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

          fs.copySync(featurePath + '/buildSrc/', `${projectPath}/db/${projectName}_app/buildSrc/`);
          fs.copySync(featurePath + '/buildSrc/', `${projectPath}/db/${projectName}_logic/buildSrc/`);
          fs.copySync(featurePath + '/buildSrc/', `${projectPath}/db/${projectName}_data/buildSrc/`);
          
        }else{
          fs.copyFileSync(featurePath + '/app/build.gradle', projectPath + '/db/' + projectName + '/build.gradle');
          fs.copyFileSync(featurePath + '/gradlew',          projectPath + '/db/' + projectName + '/gradlew');
          fs.copyFileSync(featurePath + '/gradlew.bat',      projectPath + '/db/' + projectName + '/gradlew.bat');
          fs.copySync    (featurePath + '/gradle/',          projectPath + '/db/' + projectName + '/gradle/');
          fs.copySync    (featurePath + '/buildSrc/',        `${projectPath}/db/${projectName}/buildSrc/`);

          //fs.removeSync(projectPath + '/db/'+ projectName + '/tables_ddl');
        }
      fs.removeSync(featurePath);

      feature.setInstalled(true);
    }

    public async deploy(projectName:string, connection:string, password:string, schemaOnly: boolean, ords: string, silentMode:boolean, version:string, mode:string|undefined, schema:string|undefined, nocompile:boolean|undefined):Promise<boolean>{

      let project=ProjectManager.getInstance().getProject(projectName);
      
      let prefix = os.platform() === "win32" ? "" : "./"; 
      let path:string = "";
      let buildZip:AdmZip;
      let buildInfo       = {name: version, type: mode, date: ""};

      if (version){
        if (fs.pathExistsSync(`${project.getPath()}/dist/${version}.zip`)){
          path = `${project.getPath()}/dist/${version}`;

          buildZip = new AdmZip(`${path}.zip`);
          buildZip.extractAllTo(`${path}`,true);
          buildInfo = yaml.parse(fs.readFileSync(`${path}/buildInfo.yml`).toString());

        }else{
          project.getLogger().getFileLogger().log("error",'BUILD NOT FOUND');
          console.log(chalk.red(`Build to deploy not found. Use xcl project:build to create it`));
          process.exit();
        }
      }else{
        path = project.getPath();
      }

      let gradleStringData  = prefix + "gradlew deploy -Ptarget="   + connection + " -Pusername=" + project.getUsers().get('DATA')?.getConnectionName()  + " -Ppassword=" + password + " -Pnocompile="+ nocompile +" -Pmode=" + buildInfo.type + " ";
      let gradleStringLogic = prefix + "gradlew deploy -Ptarget="   + connection + " -Pusername=" + project.getUsers().get('LOGIC')?.getConnectionName() + " -Ppassword=" + password + " -Pnocompile="+ nocompile +" -Pmode=" + buildInfo.type + " ";
      let gradleStringApp   = prefix + "gradlew deploy -Ptarget="   + connection + " -Pusername=" + project.getUsers().get('APP')?.getConnectionName()   + " -Ppassword=" + password + " -Pnocompile="+ nocompile +" -Pmode=" + buildInfo.type + " ";
      
      project.getLogger().getLogger().log("info", `Starting deployment in ${buildInfo.type} - mode...`);

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
          
          if(project.getMode()===Project.MODE_MULTI){
            path = project.getPath() + "/db/" + project.getName() + "_" + schema;
          }else{
            path = project.getPath() + "/db/" + project.getName();
          }

          project.getLogger().getLogger().log("info", `SCHEMA: ${schema.toUpperCase()}`);
          await this.hook(schema, "pre", projectName, connection, password, project);
          let success = await this.deploySchema(gradleString, project, path);
          await this.hook(schema, "post", projectName, connection, password, project);
          await this.hasInvalidObjects(project, schema, password, connection);
          
          /*let invalids = await DBHelper.getInvalidObjects(DBHelper.getConnectionProps(project.getUsers().get(schema.toUpperCase())?.getConnectionName(),password,connection)!);
          project.getLogger().getLogger().log("info",`Number of invalid objects: ${invalids.length}`);
          
          invalids.forEach((element: { name: string; type: string; }) => {
            project.getLogger().getLogger().log("info",`${element.name} (${element.type})`);
          });*/

          if(success){

            if (project.getMode() === Project.MODE_SINGLE && !schemaOnly){
              Application.installApplication(projectName, connection, password, ords);
            }

            this.cleanUp(path);
            return true;
          }else{
            return false;
          }
        }else{
          return false;
        }

      }else{
        if (silentMode){
          cli.action.start('Deploy...');
          let success = await this.silentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly, path);
          if(success){
            if(path.includes('dist')){
              this.cleanUp(path);
            }
            cli.action.stop('done');
            return true;
          }else{
            this.cleanUp(path);
            cli.action.stop('failed');
            return false;
          }
        }else{
          let success = await this.unsilentDeploy(gradleStringData, gradleStringLogic, gradleStringApp, projectName, connection, password, ords, project, schemaOnly, path);
          if (success){
            this.cleanUp(path);
            return true;
          }else{
            return false;
          }
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
                            f.toLowerCase().substring(0, f.indexOf('_', f.indexOf('_', 0) + 1)).includes( type.toLowerCase() ) &&
                            f.toLowerCase().substring(0, f.indexOf('_', f.indexOf('_', 0) + 1)).includes( schema.toLowerCase() )
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
        project.getLogger().getFileLogger().log("info",`${type}-${schema}-hooks done`);
    }

    public async unsilentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean, executePath:string):Promise<boolean>{
      let _this = this;
      let resultData, resultLogic, resultApp:boolean;
      return new Promise(async (resolve, reject)=>{
        
        gradleStringData = await _this.getChangedTables(project.getName(), (executePath+"/db/"+project.getName()+"_data").replaceAll("\\","/") + "/tables/", gradleStringData);
        let proceed:boolean = false;
        await _this.hook("data", "pre", projectName, connection, password, project);
        resultData = (await ShellHelper.executeScript(gradleStringData, executePath + "/db/" + project.getName() + "_data", true, project.getLogger())).status;
        await _this.hook("data", "post", projectName, connection, password, project);
        await _this.hasInvalidObjects(project, project.getName() + "_data", password, connection);
        proceed = await cli.confirm('Proceed with ' + projectName.toUpperCase() + '_LOGIC? (y/n)');

        if (proceed){
          
          gradleStringLogic = await _this.getChangedTables(project.getName(), (executePath+"/db/"+project.getName()+"_logic").replaceAll("\\","/") + "/tables/", gradleStringLogic);
          await _this.hook("logic","pre",projectName, connection, password, project);
          resultLogic = (await ShellHelper.executeScript(gradleStringLogic, executePath + "/db/" + project.getName() + "_logic", true, project.getLogger())).status;
          await _this.hook("logic", "post", projectName, connection, password, project);
          await _this.hasInvalidObjects(project, project.getName() + "_logic", password, connection);
          proceed = await cli.confirm('Proceed with ' + projectName.toUpperCase() + '_APP? (y/n)');
          
          if (proceed){
            
            gradleStringApp = await _this.getChangedTables(project.getName(), (executePath+"/db/"+project.getName()+"_app").replaceAll("\\","/") + "/tables/", gradleStringApp);
            await _this.hook("app", "pre", projectName, connection, password, project);
            resultApp = (await ShellHelper.executeScript(gradleStringApp, executePath + "/db/" + project.getName() + "_app", true, project.getLogger())).status;
            await _this.hook("app", "post", projectName, connection, password, project);
            await _this.hasInvalidObjects(project, project.getName() + "_app", password, connection);
            
            if (!schemaOnly){
              Application.installApplication(projectName, connection, password, ords);
            }
            
            await _this.hook("app","finally",projectName, connection, password, project);
            await _this.hook("logic","finally",projectName, connection, password, project);
            await _this.hook("data","finally",projectName, connection, password, project);
            
            project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
            resolve(resultData && resultLogic && resultApp);

          }else{
            project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
            resolve(resultData && resultLogic);
          }
        }else{
          project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
          resolve(resultData);
        }
      });
    }

    public async silentDeploy(gradleStringData:string, gradleStringLogic:string, gradleStringApp:string, projectName:string, connection:string, password:string, ords:string, project:Project, schemaOnly:boolean, executePath:string):Promise<boolean>{
      let _this = this;
      let resultData, resultLogic, resultApp:boolean;
      return new Promise( async(resolve, reject)=>{
        gradleStringData = await _this.getChangedTables(project.getName(), (executePath+"/db/"+project.getName()+"_data").replaceAll("\\","/") + "/tables/", gradleStringData);
        await _this.hook("data","pre",projectName, connection, password, project);
        resultData = (await ShellHelper.executeScript(gradleStringData, executePath+"/db/"+project.getName()+"_data", false, project.getLogger())).status;
        await _this.hook("data","post",projectName, connection, password, project);
        await _this.hasInvalidObjects(project, project.getName() + "_data", password, connection);
        
        gradleStringLogic = await _this.getChangedTables(project.getName(), (executePath+"/db/"+project.getName()+"_logic").replaceAll("\\","/") + "/tables/", gradleStringLogic);
        await _this.hook("logic","pre",projectName, connection, password, project);
        resultLogic = (await ShellHelper.executeScript(gradleStringLogic, executePath+"/db/"+project.getName()+"_logic", false, project.getLogger())).status;
        await _this.hook("logic","post",projectName, connection, password, project);
        await _this.hasInvalidObjects(project, project.getName() + "_logic", password, connection);

        gradleStringApp = await _this.getChangedTables(project.getName(), (executePath+"/db/"+project.getName()+"_app").replaceAll("\\","/") + "/tables/", gradleStringApp);
        await _this.hook("app","pre",projectName, connection, password, project);
        resultApp = (await ShellHelper.executeScript(gradleStringApp, executePath+"/db/"+project.getName()+"_app", false, project.getLogger())).status;
        await _this.hook("app","post", projectName, connection, password, project);
        await _this.hasInvalidObjects(project, project.getName() + "_app", password, connection);
        if (!schemaOnly){
          Application.installApplication(projectName, connection, password, ords);
        }
        
        await _this.hook("app", "finally", projectName, connection, password, project);
        await _this.hook("logic", "finally", projectName, connection, password, project);
        await _this.hook("data", "finally", projectName, connection, password, project);
        project.getLogger().getLogger().log("info", 'XCL - deploy ready\n---------------------------------------------------------------');
        resolve(resultData && resultLogic && resultApp);
      });
    }

    public async deploySchema(gradleString:string, project:Project, path:string):Promise<boolean>{
      return new Promise(async (resolve, reject)=>{
        gradleString = await this.getChangedTables(project.getName(), path.replaceAll("\\","/") + "/tables/", gradleString);
        resolve((await ShellHelper.executeScript(gradleString, path, true, project.getLogger())).status);
      });
    }

    public async build(projectName:string, version:string, mode:string, commit:string|undefined){
      let project:Project = ProjectManager.getInstance().getProject(projectName);
      let release         = project.getVersion();
      let projectPath     = project.getPath();
      let buildInfo       = {name: "", type:"", date: ""};

      //ProjectManager.getInstance().getProject(projectName).setVersion(version);
      let path = "";
      let buildZip:AdmZip = await this.patch(version, project, mode, (commit ? commit : version));
      //Read apex-folder and find the correct file
      console.log('...adding apps and rest modules');
      fs.readdirSync(projectPath + "/apex/").forEach(file=>{
        if ( fs.statSync(projectPath + "/apex/" + file).isDirectory() ){
          if(file.startsWith('f')){
            //If Application was exportet with Split-Option
            if(fs.existsSync(projectPath + "/apex/" + file + "/application/create_application.sql")){
              path = projectPath + "/apex/" + file + "/application/create_application.sql";
            }
            //If Application was exportet with SplitFlat-Option
            else if(fs.existsSync(projectPath + "/apex/" + file + "/create_application.sql")){
              path = projectPath + "/apex/" + file + "/create_application.sql";
            }

          }
        }else{
          if(file.startsWith('f')){
            path = projectPath + "/apex/" + file;
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
              console.log("......Replacement String was not found, Version-Number could not be set automatically!");
            }
          }
        }
      });

      buildZip.addLocalFolder(projectPath + "/rest", "rest");
      buildZip.addLocalFolder(projectPath + "/apex", "apex");

      buildInfo.name = version;
      buildInfo.type = mode;
      buildInfo.date = new Date().toLocaleDateString();

      fs.writeFileSync('buildInfo.yml',yaml.stringify(buildInfo));
      buildZip.addLocalFile('buildInfo.yml');

      buildZip.writeZip(project.getPath()+ "/" + version + ".zip");
      fs.moveSync(project.getPath()+ "/" + version + ".zip",project.getPath()+ "/dist/" + version + ".zip");
      fs.removeSync('buildInfo.yml');
    }


    async patch(version:string, project:Project, mode:string, commit:string):Promise<AdmZip>{
      

      let fileMap:Map<string,string> = new Map();
      
      let fileList:string[] = await Git.getChangedFiles(mode, commit, project.getName());
      const basePath:string = "db";
      let buildZip = new AdmZip(); 



      console.log(`Creating ${mode} - build: ${version}`);

      
      console.log('...adding .hook directories');
      
      buildZip.addLocalFolder(`${basePath}/.hooks`, `${basePath}/.hooks`);

      for(const user of project.getUserNames()){
        buildZip.addLocalFolder(`${basePath}/${user.toLowerCase()}/.hooks`, `${basePath}/${user.toLowerCase()}/.hooks`);
      }
      
      console.log('...adding _setup directory');
      let executePath = project.getPath()+`/${basePath}/_setup`.replaceAll('\\','/');
      let scripts:string = (await ShellHelper.executeScript(`find  -name '*.sql' -printf '%P\\n'`, executePath, false, new Logger(project.getPath()))).result;
      let scriptList:string[] = scripts.split('\n');
      for(let i=0; i<scriptList.length; i++){
        fileList.push(`${basePath}/_setup/` + scriptList[i]);
      }

      console.log('...adding changed files');
      for await(const file of fileList){
        if(file!='' && !file.endsWith('/') && !file.substring(file.lastIndexOf('/') + 1, file.length).startsWith('.') && !fs.statSync(file).isDirectory()){
          fileMap.set(file,file);
        }
      }

      for await (const iterator of fileMap.keys()) {
        if(fs.pathExistsSync(iterator)){
          try{
            let path = iterator.substring(0, iterator.lastIndexOf('/'));
            buildZip.addLocalFile(iterator, path);
          }catch(err){
            console.log(`...could not add: ${iterator} `);
            continue;
          }
        }
      }

      console.log('...adding necessities');
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
        buildZip.addLocalFolder(`db/${project.getName()}_${schema}/gradle/`,`db/${project.getName()}_${schema}/gradle`);
        buildZip.addLocalFolder(`db/${project.getName()}_${schema}/buildSrc/`,`db/${project.getName()}_${schema}/buildSrc`);
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

    public async getChangedTables(projectName:string, path:string, gradleString:string):Promise<string>{
      let tables = await Git.getChangedTables(projectName, path, undefined);
      
      for(let i=0; i<tables.length; i++){
        tables[i] = tables[i].replace("\.sql","").substring(tables[i].lastIndexOf("/") + 1, tables[i].length).toUpperCase();
      }

      if(tables.length>0){
        return (gradleString + "-Ptables=" + tables.join(","));
      }else{
        return gradleString;
      }  
    }

    private async hasInvalidObjects(project:Project, schema:string, password:string, connection:string):Promise<boolean>{
      let invalids = await DBHelper.getInvalidObjects(DBHelper.getConnectionProps(project.getUsers().get(schema.toUpperCase())?.getConnectionName(),password,connection)!);
      if (invalids.length>0){
        project.getLogger().getLogger().log("info",`Number of invalid objects: ${invalids.length}`);
        
        invalids.forEach((element: { name: string; type: string; errors:string[]}) => {
          project.getLogger().getLogger().log("info",`${element.name} (${element.type})`);
          element.errors.forEach((error)=>{
            project.getLogger().getLogger().log("info",`${error}`);
          })
        });
        return true;
      }else{
        return false;
      }
    }
}