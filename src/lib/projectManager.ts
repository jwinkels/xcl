//Imports
import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as os from "os";
import { Project } from "./Project";
import { ProjectNotFoundError } from "./errors/ProjectNotFoundError";
import chalk from 'chalk'
import { DBHelper, IConnectionProperties } from './DBHelper';
import cli from 'cli-ux'
import  { deliveryFactory }  from './DeliveryFactory';
import { DeliveryMethod } from './DeliveryMethod';
import { ProjectFeature } from './ProjectFeature';
import { Schema } from './Schema';
import { Environment } from './Environment';
import { FeatureManager } from './FeatureManager';
import { cpuUsage, exit } from 'process';
import { ShellHelper } from './ShellHelper';
import {Operation} from './Operation';
import { Application } from './Application';
import { string } from '@oclif/command/lib/flags';
import { interfaces } from 'inversify';

const Table = require('cli-table')

//Implementation in Singleton-Pattern because there is no need for multiple instances of the ProjectManager!
export class ProjectManager {
  public static projectYMLfile: string = "projects.yml";

  private static manager: ProjectManager;
  private static xclHome = os.homedir + "/AppData/Roaming/xcl";
  // private static project: Project;
  private static projectsYaml: yaml.Document;
  private static projectsJson: any;
  private static project: Project;

  private constructor() {
    // read projects
    ProjectManager.projectsYaml = yaml.parseDocument(fs.readFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile).toString());

    // convert to json of create an empty definition
    ProjectManager.projectsJson = ProjectManager.projectsYaml.toJSON() || { projects: {} };
    // what else belongs to PM?
  }

  /**
   * return Singelton-Instance of PM
   */
  static getInstance() {
    if (!ProjectManager.manager) {
      ProjectManager.manager = new ProjectManager();
    }
    return ProjectManager.manager;
  }

  /**
   * returns Project, when defined. Otherwise raises an exception
   *
   * @param projectName name of project
   */
  public getProject(projectName: string): Project {
    if(ProjectManager.project && ProjectManager.project.getName()==projectName){
      return ProjectManager.project;
    }else{
      if (ProjectManager.projectsJson.projects && ProjectManager.projectsJson.projects[projectName]) {
        let projectJSON = ProjectManager.projectsJson.projects[projectName];
        ProjectManager.project = new Project(projectName, projectJSON.path,'' , false);
        return ProjectManager.project;
      } else {
        throw new ProjectNotFoundError(`project ${projectName} not found`);
      }
    }
  }

  public getProjectNameByPath(projectPath: string):string{
    try {
      let index=-1;
      let name ="all";
      //Unsauber!! Überdenke projects.yaml
      for (let i=0; i<Object.values(ProjectManager.projectsJson.projects).length; i++){
        if(Object.values(ProjectManager.projectsJson.projects)[i].path==projectPath){
          name=Object.keys(ProjectManager.projectsJson.projects)[i];
        }
      }
      return name;
    } catch (error) {
      return 'all';
    }

  }

  /**
   * return Project, when found otherwise creates it
   * @param projectName name of project
   */
  public createProject(projectName: string, workspaceName: string): Project {
    // check if not allready defined
    let project;
    try {
      project = this.getProject(projectName);
      console.log(projectName + " allready created. Look @: " + project.getPath());
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        // start to create the project
        console.log(projectName + " is to be created in: " + process.cwd());
        if (os.platform() === 'win32'){
          project = new Project(projectName, process.cwd() + "\\" + projectName, workspaceName, true);
        }else{
          project = new Project(projectName, process.cwd() + "/" + projectName, workspaceName, true);
        }

        this.addProjectToGlobalConfig(project);
        Application.generateCreateWorkspaceFile(projectName, workspaceName);
      } else {
        // undefined error. what happened?
        throw err;
      }
    }

    return project;
  }

  private addProjectToGlobalConfig(project: Project) {
    ProjectManager.projectsJson.projects[project.getName()] = project.toJSON();
    fs.writeFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile, yaml.stringify(ProjectManager.projectsJson));
  }


  public removeProject(projectName: string, path: boolean, database: boolean, connection:string, syspw:string) {
    // check if not allready defined
    let project;
    try {
      project = this.getProject(projectName);

      if(database){// remove from db?
        if (connection && syspw){
          const c:IConnectionProperties = DBHelper.getConnectionProps('sys',syspw,connection);
          DBHelper.executeScript(c, __dirname + '/scripts/drop_xcl_users.sql ' + project.getName() + '_data ' +
                                                                               project.getName() + '_logic ' +
                                                                               project.getName() + '_app ' +
                                                                               project.getName() + '_depl');
        }else{
          console.log(chalk.red("ERROR: You need to provide a connection-String and the sys-user password"));
          console.log(chalk.yellow("INFO: xcl project:remove -h to see command options"));
          throw new Error("Could not remove project due to missing information");
        }
      }
      // remove from
      this.removeProjectFromGlobalConfig(project);

      // todo remove from path?
      if (path) {
        fs.removeSync(project.getPath());
        console.log(`Path ${project.getPath()} removed`);
      }

    } catch (err) {
      // undefined error. what happened?
      throw err;
    }
  }

  private removeProjectFromGlobalConfig(project: Project) {
    delete ProjectManager.projectsJson.projects[project.getName()];
    fs.writeFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile, yaml.stringify(ProjectManager.projectsJson));
    console.log(`Project ${project.getName()} removed`);
  }

  public getProjects():Project[] {

    let projects:Project[] = [];

    Object.keys(ProjectManager.projectsJson.projects).forEach(function(projectName) {
      let projectJSON = ProjectManager.projectsJson.projects[projectName];
      projects.push(new Project(projectName, projectJSON.path,'', false));
    });

    return projects;
  }

  public listProjects() {
    const table = new Table({
      head: [
        chalk.blueBright('name'),
        chalk.blueBright('path'),
        chalk.redBright('status')
      ]
    });

    const projects:Project[] = ProjectManager.getInstance().getProjects();
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      var status = project.getErrorText();
      table.push([ project.getName(), project.getPath(), status ? chalk.red(status) : chalk.green('VALID') ]);
    }

    console.log(table.toString());
  }

  public getProjectPath(projectName:string):string{
    const projects:Project[] = ProjectManager.getInstance().getProjects();
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (project.getName()===projectName){
        return project.getPath();
      }
    }
    return "";
  }

  public async initializeProject(projectName: string, flags: { help: void; syspw: string | undefined; connection: string | undefined; force: boolean; yes: boolean; objects: boolean; users:boolean;}) {
    const p:Project = this.getProject(projectName);
    
    flags.syspw = flags.syspw ? flags.syspw : Environment.readConfigFrom(p.getPath() , "syspw");

    const c:IConnectionProperties = DBHelper.getConnectionProps('sys', flags.syspw, flags.connection);    

    // Prüfen ober es den User schon gibt
    if (await DBHelper.isProjectInstalled(p, c) && flags.users) {
      if ( !flags.force) {
        console.log(chalk.yellow(`Warning: ProjectSchemas already exists in db!!!`));
        console.log(chalk.yellow(`If you wish to drop users before, you could use force flag`));
        await p.getStatus().updateUserStatus();
        return;
      } else { 
        if (flags.force && !flags.yes) {
          const confirmYN = await cli.confirm(chalk.green(`Force option detected, schema will be dropped. Continue Y/N`));
          
          if (!confirmYN) {
            console.log(chalk.yellow(`Project initialization canceled`));          
            return;
          }
        }
        
        console.log(chalk.yellow(`Dropping existing schemas`));
        await DBHelper.executeScript(c, __dirname + '/scripts/drop_xcl_users.sql ' + p.getName() + '_data ' +
                                                                           p.getName() + '_logic ' +
                                                                           p.getName() + '_app ' +
                                                                           p.getName() + '_depl');
      }
    }

    if (flags.users){
      console.log(chalk.green(`OK, Schemas werden installiert`));
      await DBHelper.executeScript(c, __dirname + '/scripts/create_xcl_users.sql ' + p.getName() + '_depl ' +
                                                                            p.getName() + ' ' +  //TODO: Generate strong password!
                                                                            p.getName() + '_data ' +
                                                                            p.getName() + '_logic ' +
                                                                            p.getName() + '_app');

      if (await DBHelper.isProjectInstalled(p, c)) {
        console.log(chalk.green(`Project successfully installed`));
        p.getStatus().updateUserStatus();
      }
    }

    if (flags.objects){
      //Execute setup files 
      const config = p.getConfig();
      await config.xcl.setup.forEach((element: { name: string; path: string; }) => {
        DBHelper.executeScriptIn(c, element.name, element.path);
        p.updateSetupStep(element.name, element.path);
      });
    }
    // TODO: Abfrage nach syspwd?

    // Indextablespace auslagern
    // > data user bekommt das recht tablespaces anzulegen. hier muss ggf. auch das Recht weitergegegen werden

    
    // durch features loopen und deren install methode aufrufen

    // user erstellen

    // app erstellen
  }

  public async build(projectName: string, version:string){
    
    let  p:Project = this.getProject(projectName);
   
    deliveryFactory.getNamed<DeliveryMethod>("Method",p.getDeployMethod().toUpperCase()).build(projectName,version);
  }

  public async deploy(projectName: string, connection:string, password:string, schemaOnly: boolean){
    console.log(projectName);
    let p:Project = this.getProject(projectName);
    let path:string = p.getPath();

    if (!p.getStatus().hasChanged()){
      deliveryFactory.getNamed<DeliveryMethod>("Method",p.getDeployMethod().toUpperCase()).deploy(projectName, connection, password, schemaOnly);
    }else{
      console.log(chalk.yellow('Project config has changed! Execute xcl project:plan and xcl project:apply!'));
    }
  }

  public async plan(projectName: string){
    let  p:Project =  this.getProject(projectName);
    let path:string =  p.getPath();
    let commands:Array<String> = new Array<String>();
    let commandCount=1;
    
    if( p.getStatus().hasChanged()){
      
      p.getFeatures().forEach((feature:ProjectFeature, key:String)=>{
        if(feature.getType()==="DB" ){
          if (FeatureManager.priviledgedInstall(feature.getName()) && !commands[0]){
              commands[0]='xcl config:defaults '+ projectName + ' -s syspw $PASSWORD';
          }else{
            console.log("SYS NOt needed for feature : "+feature.getName());
          }
          
          let operation = p.getStatus().checkDependency(feature);
          if(operation === Operation.INSTALL){
            console.log(chalk.green('+')+' install '+feature.getName());
            console.log(chalk.green('+++')+' xcl feature:install ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection"));
            commands[commandCount]='xcl feature:install ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection");
          }else if(operation === Operation.UPDATE){
            console.log(chalk.yellow('*')+' update '+feature.getName());
            console.log(chalk.yellow('***')+' xcl feature:update ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection"));
            commands[commandCount]='xcl feature:update ' + feature.getName() +' '+ feature.getReleaseInformation() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection");
          }
          
          //WE DONT DO THAT HERE!
          /*else{
            console.log(chalk.red('-')+' deinstall '+feature.getName());
            console.log(chalk.red('---')+' xcl feature:deinstall ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection"));
            commands[commandCount]='xcl feature:deinstall ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection");
          }*/

          commandCount=commandCount+1;
          
        }
      });

      p.getStatus().getRemovedDependencies();

      if(!p.getStatus().checkUsers()){        
        p.getUsers().forEach((user:Schema, key:String)=>{
            console.log(chalk.green('+') + ' create user '+ key);
        });
        console.log(chalk.green('+++')+' xcl project:init ' + projectName + ' --users --connection=' + Environment.readConfigFrom(path, "connection"));
        commands[commandCount] =  'xcl project:init ' + projectName + ' --users --connection=' + Environment.readConfigFrom(path, "connection");
        
        commandCount=commandCount+1;
        
        if (!commands[0]){
          commands[0]='xcl config:defaults '+ projectName + ' -s syspw $PASSWORD';
        }
      }

      if(p.getStatus().getChanges().get('SETUP')){
        
        console.log(chalk.green('+') + ' SETUP ');
        console.log(chalk.green('+++')+' xcl project:init ' + projectName + ' --objects --connection=' + Environment.readConfigFrom(path, "connection"));
        commands[commandCount] =  'xcl project:init ' + projectName + ' --objects --connection=' + Environment.readConfigFrom(path, "connection");

        commandCount=commandCount+1;

        if (!commands[0]){
          commands[0]='xcl config:defaults '+ projectName + ' -s syspw $PASSWORD';
        }
      }
    
      //commands[commandCount] ='xcl project:deploy '+ projectName + ' --connection=' + Environment.readConfigFrom(path, "connection") + ' --password=' + Environment.readConfigFrom(path, "password");
      console.log(chalk.green('+')+' deploy application');
      //console.log(chalk.green('+++ ')+commands[commandCount]);
      if (commands[0]){
        commandCount=commandCount+1;
        console.log(chalk.green('+')+' xcl config:defaults ' + projectName + ' --reset syspw');
        commands[commandCount]='xcl config:defaults ' + projectName + ' --reset syspw';
      }
    }else{
      console.log(chalk.yellow('INFO: Project dependencies have no changes!'));
    }

    let fileName = path;
   
    fileName = fileName +'/plan.sh';

    fs.removeSync(fileName);
    fs.writeFileSync(fileName,'#!/bin/bash'+"\n");
    for (let i = 0; i<commands.length; i++){
      if(commands[i]){
          fs.appendFileSync(fileName,commands[i]+"\n");
      }
    }
  }

  public async apply(projectName: string, setupOnly:boolean){
    
    let project:Project = this.getProject(projectName);
    if (fs.existsSync(project.getPath()+'/plan.sh')){
      Application.generateSQLEnvironment(projectName, __dirname);
      ShellHelper.executeScript('plan.sh',project.getPath())
      .then((output)=>{
        project.getStatus().updateStatus();
        if (!project.getStatus().hasChanged()){
          console.log(chalk.green('SUCCESS: Everything up to date!'));
          fs.removeSync('plan.sh');
          if(!setupOnly){
            console.log('DEPLOY APPLICATION: ');
            this.deploy(projectName, 
                        Environment.readConfigFrom(project.getPath(),'connection'),
                        Environment.readConfigFrom(project.getPath(),'password'),false
                        );
          }
        }else{
          console.log(chalk.red('FAILURE: apply was made but there are still changes!'));
        }      
      })
      .catch(()=>{
        console.log(chalk.red('ERROR: Update was not successfull! There are still changes!'));
      });
    }else{
      console.log(chalk.yellow('Execute xcl project:plan first!'));
    }
  }

}
