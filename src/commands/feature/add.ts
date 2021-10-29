import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/ProjectManager';
import { Project } from '../../lib/Project';
import chalk from 'chalk';
import cli from 'cli-ux';
import { Environment } from '../../lib/Environment';
import * as fs from "fs-extra";
import * as yaml from "yaml";
import inquirer = require("inquirer");

export default class FeatureAdd extends Command {
  static description = 'add Feature to dependency list'

  static flags = {
    help: flags.help({char: 'h'}),
    interactive: flags.boolean({char: 'i', description: 'interactive mode'})
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
    const {args} = this.parse(FeatureAdd);

    
    let releases:string[] = [];
    let version:any;
    let added:boolean = false;
    if(!args.version && args.feature){
      releases= await FeatureManager.getInstance().getFeatureReleases(args.feature);
      version = await inquirer.prompt([{
          name: 'number',
          message: `choose a version: `,
          type: 'list',
          choices: releases
        }]);

      args.version = version.number;
        //args.version= await cli.prompt('Please enter a version number from the list above you like to add');
    }

    if(FeatureManager.getInstance().getFeatureType(args.feature) === "DB" && (!args.username || !args.password)){
      let user = await getUsername(args.project);
      args.username = user.username;
      args.password = user.password;
    }


    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      added = await FeatureManager.getInstance().addFeatureToProject(args.feature,args.version, ProjectManager.getInstance().getProjectNameByPath(process.cwd()), args.username, args.password); 
    }else{
      if ( args.project ){
        added = await FeatureManager.getInstance().addFeatureToProject(args.feature, args.version, args.project, args.username, args.password);
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
          connection = await cli.prompt('Connection [host:port/servicename]');
        }
        let syspw:string = await cli.prompt('SYS-Password',{type: 'hide'});
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
