//Imports
import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as path from "path";
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
import { ShellHelper } from './ShellHelper';
import {Operation} from './Operation';
import { Application } from './Application';
import { Utils } from './Utils';
import { Git } from "./Git";
import { ProjectWizardConfiguration } from "../commands/project/create";
const password = require('secure-random-password');
//import FeatureInstall from "../commands/feature/install";

const Table = require('cli-table')
//Implementation in Singleton-Pattern because there is no need for multiple instances of the ProjectManager!
export class ProjectManager {
  public static projectYMLfile = "projects.yml";

  private static manager: ProjectManager;
  private static xclHome = os.homedir + "/AppData/Roaming/xcl";
  private static projectsYaml: yaml.Document;
  private static projectsJson: any;
  private static project: Project;

  private constructor() {
    // read projects
    ProjectManager.projectsYaml = yaml.parseDocument( fs.readFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile ).toString());

    // convert to json of create an empty definition
    ProjectManager.projectsJson = ProjectManager.projectsYaml.toJSON() || { projects: {} };
    // what else belongs to PM?
  }

  /**
   * return Singelton-Instance of PM
   */
  static getInstance():ProjectManager{
    if ( !ProjectManager.manager ) {
      ProjectManager.manager = new ProjectManager();
    }
    return ProjectManager.manager;
  }

  /**
   * returns Project, when defined. Otherwise raises an exception
   *
   * @param projectName name of project
   */
  public getProject( projectName: string ): Project {
    if( ProjectManager.project && ProjectManager.project.getName() == projectName ){
      return ProjectManager.project;
    }else{

      if ( ProjectManager.projectsJson.projects && ProjectManager.projectsJson.projects[projectName] ) {
        const projectJSON      = ProjectManager.projectsJson.projects[projectName];
        ProjectManager.project = new Project( projectName, projectJSON.path, '', false );
        return ProjectManager.project;
      } else {
        // console.log(new Error().stack);
        throw new ProjectNotFoundError(`project ${projectName} not found`);
      }
    }
  }

  public getProjectNameByPath(projectPath: string):string{
    try {
      let name ="all";
      //Unsauber!! Überdenke projects.yaml
      for (let i=0; i < Object.values( ProjectManager.projectsJson.projects ).length; i++){
        let project:any = Object.values(ProjectManager.projectsJson.projects)[i];
        if (project) {
          if( project.path == projectPath ){
            name = Object.keys(ProjectManager.projectsJson.projects)[i];
          }
        }
      }
      //Wenn in der Liste nichts gefunden ist kann es trotzdem sein, dass es ein XCL-Projekt ist
      //Aber es ist noch nicht in der Projektliste, aufgrund git clone o.ä.
      //Daher prüfen ob eine xcl.yaml existiert, wenn ja, laden und in die Projektliste aufnehmen
      if ( name == "all" && fs.existsSync(projectPath + '/xcl.yml') ){
        const tmpProject:Project = new Project('', projectPath, '', false);
        this.addProjectToGlobalConfig(tmpProject);
        name = tmpProject.getName();
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
  public createProject(projectName: string, workspaceName: string, singleSchema:boolean): Project {
    // check if not allready defined
    let project;
    try {
      project = this.getProject(projectName);
      console.log(projectName + " allready created. Look @: " + project.getPath());
    } catch (err) {
      if (err instanceof ProjectNotFoundError) {
        // start to create the project
        console.log(projectName + " is to be created in: " + process.cwd());

        project = new Project(projectName, process.cwd() + path.sep + projectName, workspaceName, true, singleSchema);


        this.addProjectToGlobalConfig( project );
        Application.generateCreateWorkspaceFile( projectName, workspaceName );
      } else {
        // undefined error. what happened?
        throw err;
      }
    }

    return project;
  }

  /**
   * return Project, when found otherwise creates it
   * @param projectConfigFromWizard configuration brought to us by wizard
   */
   public createProjectFromConfig(projectConfigFromWizard:ProjectWizardConfiguration): Project {
    // TODO: when allready defined, why not overwrite? After confirmation?
    const project = new Project(projectConfigFromWizard.project,
                                process.cwd() + path.sep + projectConfigFromWizard.project,
                                projectConfigFromWizard.workspace,
                                true,
                                projectConfigFromWizard.multi.toLowerCase() === Project.MODE_SINGLE);


    // Project define in GlobalJson
    this.addProjectToGlobalConfig( project );


    Application.generateCreateWorkspaceFile( projectConfigFromWizard.project, projectConfigFromWizard.workspace );

    project.setEnvironment(Environment.setVarsFromWizard(projectConfigFromWizard, project));

    return project;
  }

  private addProjectToGlobalConfig(project: Project) {
    ProjectManager.projectsJson.projects[project.getName()] = project.toJSON();
    fs.writeFileSync( ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile, yaml.stringify(ProjectManager.projectsJson ) );
  }


  public removeProject(projectName: string, path: boolean, database: boolean, connection:string, syspw:string):void {
    // check if not allready defined
    let project;
    try {
      project = this.getProject(projectName);

      if( database ){// remove from db?
        if (connection && syspw){
          const c:IConnectionProperties = DBHelper.getConnectionProps('sys', syspw, connection);
          DBHelper.executeScript(c, Utils.checkPathForSpaces( __dirname + '/scripts/drop_xcl_users.sql' ) + ' ' + project.getName() + '_data ' +
                                                                               project.getName() + '_logic ' +
                                                                               project.getName() + '_app ' +
                                                                               project.getName() + '_depl',
                                                                               project.getLogger());
        }else{
          console.log( chalk.red("ERROR: You need to provide a connection-String and the sys-user password") );
          console.log( chalk.yellow("INFO: xcl project:remove -h to see command options") );
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
    delete ProjectManager.projectsJson.projects[ project.getName() ];
    fs.writeFileSync(ProjectManager.xclHome + "/" + ProjectManager.projectYMLfile, yaml.stringify( ProjectManager.projectsJson ) );
    console.log(`Project ${project.getName()} removed`);
  }

  public getProjects():Project[] {

    const projects:Project[] = [];

    Object.keys( ProjectManager.projectsJson.projects).forEach( function(projectName) {
      const projectJSON = ProjectManager.projectsJson.projects[ projectName ];
      projects.push( new Project( projectName, projectJSON.path, '', false ) );
    });

    return projects;
  }

  public listProjects():void {
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
      const status  = project.getErrorText();
      table.push( [ project.getName(), project.getPath(), status ? chalk.red(status) : chalk.green('VALID') ] );
    }

    console.log( table.toString() );
  }

  public getProjectPath(projectName:string):string{
    const projects:Project[] = ProjectManager.getInstance().getProjects();
    for ( let i = 0; i < projects.length; i++ ) {
      const project = projects[i];
      if ( project.getName() === projectName ){
        return project.getPath();
      }
    }
    return "";
  }

  public async initializeProject(projectName: string, flags: { help: void; syspw: string | undefined; connection: string | undefined; force: boolean; yes: boolean; objects: boolean; users:boolean;}):Promise<void> {
    const p:Project = this.getProject(projectName);

    flags.syspw = flags.syspw ? flags.syspw : Environment.readConfigFrom(p.getPath() , "syspw");

    const c:IConnectionProperties = DBHelper.getConnectionProps('sys', flags.syspw, flags.connection);

    let userlist:string = "";

    for(let user in p.getUsers().values()){
      userlist = userlist.concat(user, " ");
    }

    userlist = userlist.trimEnd();

    // Prüfen ober es den User schon gibt
    if (await DBHelper.isProjectInstalled(p, c) && flags.users) {
      if ( !flags.force ) {
        console.log(chalk.yellow(`Warning: ProjectSchemas already exists in db!!!`));
        console.log(chalk.yellow(`If you wish to drop users before, you could use force flag`));
        await p.getStatus().updateUserStatus();
        return;
      } else {
        if ( flags.force && !flags.yes ) {
          const confirmYN = await cli.confirm( chalk.green(`Force option detected, schema will be dropped. Continue Y/N`) );

          if ( !confirmYN ) {
            console.log( chalk.yellow(`Project initialization canceled`) );
            return ;
          }
        }

        console.log( chalk.yellow(`Dropping existing schemas`) );
        await DBHelper.executeScript(c, Utils.checkPathForSpaces( __dirname + '/scripts/drop_xcl_users.sql' ) + ' ' + p.getName() + '_data ' +
                                                                           p.getName() + '_logic ' +
                                                                           p.getName() + '_app ' +
                                                                           p.getName() + '_depl',
                                                                           p.getLogger());
      }
    }

    if (flags.users){
      console.log(chalk.green(`install schemas...`));

      /*let randomPassword:string = password.randomPassword({characters: password.upper, length:   ( Math.floor( Math.random() *6 ) + 4)}) +
                           password.randomPassword({characters: password.lower, length:   ( Math.floor( Math.random() *6 ) + 4)}) +
                           password.randomPassword({characters: password.digits, length:  ( Math.floor( Math.random() *6 ) + 4)});
      */
      let randomPassword:string = password.randomPassword({characters: [password.upper, password.lower , {characters: password.digits, length: ( Math.floor( Math.random() * 4 ) + 4) }], length: ( Math.floor( Math.random() * 12 ) + 4)});

      let numberOfHashtags:number = Math.floor(Math.random()*randomPassword.length/2) + 2;

      for(let i=0; i<numberOfHashtags; i++){
        let position = Math.floor(Math.random()*randomPassword.length/2) + 1;
        randomPassword = [randomPassword.slice(0, position), '#', randomPassword.slice(position)].join('');
      }

      if (p.getMode() === 'multi'){
        await DBHelper.executeScript(c, Utils.checkPathForSpaces( __dirname + '/scripts/create_xcl_users.sql') + ' ' + p.getName() + '_depl ' +
                                                                            randomPassword + ' ' +
                                                                            p.getName() + '_data ' +
                                                                            p.getName() + '_logic ' +
                                                                            p.getName() + '_app',
                                                                            p.getLogger());
      }else{
        await DBHelper.executeScript(c, Utils.checkPathForSpaces( __dirname + '/scripts/create_user.sql') + ' ' + p.getName() + ' ' +
                                                                            randomPassword,
                                                                            p.getLogger()
                                                                            );
      }

      if ( await DBHelper.isProjectInstalled(p, c) ) {
        console.log( chalk.green(`Project successfully installed`) );
        if (p.getMode() === Project.MODE_MULTI){
          //console.log( chalk.yellow(`${p.getName().toUpperCase()}_DEPL[${p.getName().toUpperCase()}_<DATA,LOGIC,APP>] - Password: ${randomPassword}`));
          console.log( chalk.yellow(` ${p.getUsers().get('DATA')?.getConnectionName()}, ${p.getUsers().get('LOGIC')?.getConnectionName()}, ${p.getUsers().get('APP')?.getConnectionName()} - Password: ${randomPassword}`));
        }else{
          console.log( chalk.yellow(` ${p.getUsers().get('APP')?.getName()} - Password: ${randomPassword}`));
        }
        p.setEnvironmentVariable('password', randomPassword);
        p.getStatus().updateUserStatus();
      }
    }

    if ( flags.objects ){
      //Execute setup files
      const config = p.getConfig();
      if( config.xcl.setup ){
        await config.xcl.setup.forEach( ( element: { name: string; path: string; } ) => {
            console.log( element.name, element.path );
            DBHelper.executeScriptIn( c, element.name, element.path, p.getLogger() );
          	p.updateSetupStep( element.name, element.path );
        });
      }
    }
    // TODO: Abfrage nach syspwd?

    // Indextablespace auslagern
    // > data user bekommt das recht tablespaces anzulegen. hier muss ggf. auch das Recht weitergegeben werden


    // durch features loopen und deren install methode aufrufen

    // user erstellen

    // app erstellen
  }

  public async build(projectName: string, version:string, mode:string, commit:string|undefined):Promise<void>{

    const p:Project = this.getProject(projectName);

    deliveryFactory.getNamed<DeliveryMethod>( "Method", p.getDeployMethod().toUpperCase() ).build(projectName, version, mode, commit);
  }

  public deploy(projectName: string, connection:string, password:string, schemaOnly: boolean, ords:string, silentMode:boolean, version:string, mode:string, schema:string|undefined):void{
    const p:Project = this.getProject(projectName);
    if (!connection){
      if (!p.getEnvironmentVariable('connection')){
        console.log(chalk.red('No connection declared! Use xcl config:defaults -s connection or read deploy help!'));
      }else{
        console.log(p.getEnvironmentVariable('connection'));
        connection = p.getEnvironmentVariable('connection')!;
      }
    }

    p.getLogger().getLogger().log("info", 'Start XCL - Deploy...\n---------------------------------------------------------------');
    if ( !p.getStatus().hasChanged() ){
      if (p.getDeployMethod()){
        deliveryFactory.getNamed<DeliveryMethod>( "Method", p.getDeployMethod().toUpperCase() ).deploy( projectName, connection, password, schemaOnly, ords, silentMode, version, mode, schema );
        Git.getCurrentCommitId()
          .then((commitId)=>{p.getStatus().setCommitId(commitId)})
          .catch((reason)=>{});
        p.getStatus().setVersion(version);
      }else{
        console.log('No Deploy-Method defined, add deploy method via xcl feature:add first.');
        console.log('To get a list of available deploy methods use xcl feature:list -a DEPLOY');
      }
    }else{
      console.log( chalk.yellow('Project config has changed! Execute xcl project:plan and xcl project:apply!') );
    }
  }

  public async plan(projectName: string):Promise<void>{
    const p:Project =  this.getProject(projectName);
    const path:string =  p.getPath();
    const commands:Array<string> = new Array<string>();
    let commandCount=1;

    if( p.getStatus().hasChanged() ){

      p.getFeatures().forEach( ( feature:ProjectFeature ) =>{
        if( feature.getType()==="DB" ){
          if ( FeatureManager.priviledgedInstall( feature.getName() ) && !commands[0] ){
              commands[0] = 'xcl config:defaults syspw $PASSWORD ' + projectName;
          }else{
            console.log( "SYS not needed for feature : " + feature.getName() );
          }

          const operation = p.getStatus().checkDependency( feature );
          if( operation === Operation.INSTALL ){
            console.log( chalk.green('+') + ' install ' + feature.getName() );
            console.log( chalk.green('+++') + ' xcl feature:install ' + feature.getName() + ' ' + projectName + ' --connection=' + Environment.readConfigFrom( path, "connection" ) );
            commands[commandCount] = 'xcl feature:install ' + feature.getName() + ' ' + projectName + ' --connection=' + Environment.readConfigFrom( path, "connection" );
          }else if( operation === Operation.UPDATE ){
            console.log( chalk.yellow('*') + ' update ' + feature.getName() );
            console.log( chalk.yellow('***') + ' xcl feature:update ' + feature.getName() + ' ' + projectName + ' --connection=' + Environment.readConfigFrom( path, "connection" ) );
            commands[commandCount]= 'xcl feature:update ' + feature.getName() + ' ' + feature.getReleaseInformation() + ' ' + projectName + ' --connection=' + Environment.readConfigFrom( path, "connection" );
          }

          //WE DONT DO THAT HERE!
          /*else{
            console.log(chalk.red('-')+' deinstall '+feature.getName());
            console.log(chalk.red('---')+' xcl feature:deinstall ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection"));
            commands[commandCount]='xcl feature:deinstall ' + feature.getName() + ' '+ projectName +' --connection=' + Environment.readConfigFrom(path, "connection");
          }*/

          commandCount = commandCount + 1;

        }
      });

      p.getStatus().getRemovedDependencies();

      if( !p.getStatus().checkUsers() ){
        if (p.getMode() === Project.MODE_MULTI){
          p.getUsers().forEach( ( user:Schema, key:string ) => {
              console.log( chalk.green('+') + ' create user '+ key );
          });
        }else{
          console.log( chalk.green('+') + ' create user '+ p.getUsers().get('APP')?.getName() );
        }
        console.log( chalk.green('+++') + ' xcl project:init ' + projectName + ' --users --connection=' + Environment.readConfigFrom( path, "connection" ) );
        commands[commandCount] =  'xcl project:init ' + projectName + ' --users --connection=' + Environment.readConfigFrom(path, "connection");

        commandCount = commandCount + 1;

        if ( !commands[0] ){
          commands[0] = 'xcl config:defaults syspw $PASSWORD ' + projectName;
        }
      }

      if( p.getStatus().getChanges().get('SETUP') ){

        console.log( chalk.green('+') + ' SETUP ');
        console.log( chalk.green('+++')+' xcl project:init ' + projectName + ' --objects --connection=' + Environment.readConfigFrom(path, "connection") );
        commands[commandCount] =  'xcl project:init ' + projectName + ' --objects --connection=' + Environment.readConfigFrom(path, "connection");

        commandCount = commandCount + 1;

        if ( !commands[0] ){
          commands[0] = 'xcl config:defaults syspw $PASSWORD ' + projectName;
        }
      }

      //commands[commandCount] ='xcl project:deploy '+ projectName + ' --connection=' + Environment.readConfigFrom(path, "connection") + ' --password=' + Environment.readConfigFrom(path, "password");
      console.log( chalk.green('+') + ' deploy application' );
      //console.log(chalk.green('+++ ')+commands[commandCount]);
      if ( commands[0] ){
        commandCount = commandCount + 1;
        console.log( chalk.green('+') + ' xcl config:defaults --reset syspw ' + projectName);
        commands[commandCount] = 'xcl config:defaults --reset syspw ' + projectName;
      }

      let fileName = path;

      fileName = fileName + '/plan.sh';

      fs.removeSync(fileName);
      fs.writeFileSync(fileName, '#!/bin/bash' + "\n");
      for (let i = 0; i<commands.length; i++){
        if( commands[i] ){
            fs.appendFileSync( fileName, commands[i]+"\n" );
        }
      }

      fs.chmodSync(fileName, '777');
    }else{
      console.log( chalk.yellow('INFO: No changes in Project dependencies!') );
    }
  }

  public async apply(projectName: string, setupOnly:boolean, version:string, mode:string):Promise<void>{
    let ready:boolean = false;
    const project:Project = this.getProject(projectName);
    if ( fs.existsSync( project.getPath() + '/plan.sh' ) ){
      Application.generateSQLEnvironment( projectName, __dirname );
      const plansh = fs.readFileSync( project.getPath() + '/plan.sh' ).toString();
      const commands = plansh.split("\n");
      if ( commands.length > 1 ){
        for (let i = 1; i <= commands.length - 1; i++){

          //SPLIT COMMAND FROM ARGUMENTS
          const command = commands[i].substr( 0, commands[i].indexOf( " ", 5 ) ).trim();
          //const argv    = commands[i].substr( command.length + 1, commands[i].length ).split(" ");

          if(command){
            let status:any = (await ShellHelper.executeScript( commands[i], project.getPath(), true, project.getLogger() )).status;
            if (!status){
              console.log('An unexpected error occured, please check log for details!');
              process.exit();
            }
          }
        }
      }else{
        console.log("Error reading XCL Commands!");
      }

        project.getStatus().updateStatus();

        if ( !project.getStatus().hasChanged() ){
          console.log("\n\n\r");
          console.log( chalk.green('SUCCESS: Everything up to date!') );
          fs.removeSync( 'plan.sh' );
          if( !setupOnly ){
            console.log( 'DEPLOY APPLICATION: ' );
            this.deploy(projectName,
                        Environment.readConfigFrom( project.getPath(), 'connection' ),
                        Environment.readConfigFrom( project.getPath(), 'password' ),
                        false,
                        Environment.readConfigFrom( project.getPath(), 'ords'),
                        true,
                        version, mode, Environment.readConfigFrom( project.getPath(), 'schema' ) );
          }
        }else{
          console.log("\n\n\r");
          console.log( chalk.red( 'FAILURE: apply was made but there are still changes!' ) );
        }
    }else{
      console.log( chalk.yellow( 'Execute xcl project:plan first!' ) );
    }
  }

}