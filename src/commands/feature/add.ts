import {Command, Flags, CliUx} from '@oclif/core'
import {FeatureManager} from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/ProjectManager';
import { Project } from '../../lib/Project';
import chalk from 'chalk';
import { Environment } from '../../lib/Environment';
import * as fs from "fs-extra";
import yaml from "yaml";
import inquirer from "inquirer";

export default class FeatureAdd extends Command {
  static description = 'add Feature to dependency list'

  static flags = {
    help:        Flags.help({char: 'h'}),
    interactive: Flags.boolean({char: 'i', description: 'interactive mode'}),
    custom:      Flags.boolean({char: 'c', description: 'add a custom feature'})
  }

  static args = [{
                  name: 'feature',
                  description: 'Name of the Feature to add',
                  required: true
                },
                {
                  name: 'project',
                  description: 'Name of the Project (when not in a xcl-Project path)',
                  default: Environment.readConfigFrom(process.cwd(),"project")              
                },
                {
                  name: 'username',
                  description: 'schema name for the feature to be installed in'
                },
                {
                  name: 'password',
                  description: 'password for the new schema'
                },
                {
                  name: 'version',
                  description: 'Version of the Feature',
                  required: false
                }
              ];

  async run() {
    const {args, flags} = await this.parse(FeatureAdd);

    
    let releases:string[] = [];
    let version:any;
    let custom:any;
    let added:boolean = false;
    let customFeature:{zip:string, installScript:string, creates:string} = {zip: "",installScript:"", creates:""};
    if(!args.version && args.feature && !flags.custom){
      releases= await FeatureManager.getInstance().getFeatureReleases(args.feature);
      version = await inquirer.prompt([{
          name: 'number',
          message: `choose a version: `,
          type: 'list',
          choices: releases
        }]);

      
        //args.version= await cli.prompt('Please enter a version number from the list above you like to add');
    }

    if(flags.custom){
      version = await inquirer.prompt([{
        name: 'number',
        message: `insert version number: `,
        type: 'input'
      }]);

      custom = await inquirer.prompt([{
        name: 'zipPath',
        message: 'insert location of zip archive: ',
        type: 'input',
        default: `dependencies/${args.feature}.zip`
      },{
        name: 'installScript',
        message: 'insert install script name: ',
        type: 'input'
      },{
        name: 'creates',
        message: 'enter one or more object created by the install script ("," seperated): ',
        type: 'input'
      }]);

      customFeature.installScript = custom.installScript;
      customFeature.zip           = custom.zipPath;
      if(!(custom.creates as string).includes(',')){
        console.log(chalk.blueBright("INFO: You did not specify any objects created by the custom feature. XCL will use the target schema to check if feature is installed!"));
        customFeature.creates       = "";
      }else{
        customFeature.creates       = custom.creates;
      }
        
    }

    args.version = version.number;

    if(flags.custom || (FeatureManager.getInstance().getFeatureType(args.feature, args.project) === "DB" && (!args.username || !args.password))){
      let user = await getUsername(args.project);
      args.username = user.username;
      args.password = user.password;
    }


    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      added = await FeatureManager.getInstance().addFeatureToProject(args.feature,args.version, ProjectManager.getInstance().getProjectNameByPath(process.cwd()), args.username, args.password, flags.custom, customFeature); 
    }else{
      if ( args.project ){
        added = await FeatureManager.getInstance().addFeatureToProject(args.feature, args.version, args.project, args.username, args.password, flags.custom);
      }else{
        console.log(chalk.red('ERROR: You must specify a project or be in a project directory!'));
      }
    }

    if (added){
      let confirm = await inquirer.prompt({
          type: "confirm",
          name: "install",
          message:"install the feature now"
      });

      if (confirm.install){
        let connection:string =Environment.readConfigFrom(process.cwd(),"connection");
        if (!connection){
          connection = await CliUx.ux.prompt('Connection [host:port/servicename]');
        }
        let syspw:string = await CliUx.ux.prompt('SYS-Password',{type: 'hide'});
        FeatureManager.getInstance().installProjectFeature(args.feature, connection, syspw, args.project);
      }else{
        console.log(chalk.blueBright('Feature was added! You can install it using feature:install'));
      }
    }
  }
}

async function getUsername(projectName:string):Promise<any> {
  // read project and env to show current values
  let prj:any = fs.existsSync("xcl.yml") ? yaml.parse(fs.readFileSync("xcl.yml").toString()) : { xcl: {project: projectName} };
  let env:any = fs.existsSync(".xcl/env.yml") ? yaml.parse(fs.readFileSync(".xcl/env.yml").toString()) : { };
  let project:Project = ProjectManager.getInstance().getProject(projectName!);
  let answer = await inquirer.prompt([{

      name: 'username',
      message: `Install Feature in: `,
      type: 'list',
      choices: Array.from(project.getUserNames()).concat(['Other'])
  }]);

  if (answer.username === 'Other'){
  answer = await inquirer.prompt([{

      name: 'username',
      message: `Enter username: `,
      type: 'input'
    },
    {
      name: 'password',
      message: `Enter password:`,
      type: 'password'
    }]);
  }else{
    let username:string = answer.username;
    let user:string = username.replace(projectName.toUpperCase()+'_','');;
    answer.username = user.toUpperCase()
  }

  return answer;
}
