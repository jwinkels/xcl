import {Command, Flags} from '@oclif/core'
import { Environment } from '../../lib/Environment'
// import {ProjectManager} from '../../lib/ProjectManager'
import chalk from 'chalk';
import * as fs from "fs-extra";
import * as yaml from "yaml";
import inquirer = require("inquirer");
import { ProjectManager } from '../../lib/ProjectManager';

export default class ProjectCreate extends Command {
  static description = 'creates a project including a new directory and the configured folder structure'

  static flags = {
    help:             Flags.help({char: 'h'}),
    workspace:        Flags.string({char: 'w',
                             description: 'workspace name the application should be installed in',
                             default: Environment.readConfigFrom(process.cwd(),'project', false)
                            }),
    "single-schema" : Flags.boolean ({description: 'one schema instead of three, no deployment user'}),
    interactive :     Flags.boolean ({char: 'i', description: 'Interactive wizard that guides you through the creation of the project'})
  }

  static args = [
                  {
                    name: 'project',
                    description: 'name of the project to create',
                    required: false
                  }
                ]

  async run() {
    const {args, flags} = await this.parse(ProjectCreate)

    if (flags.interactive) {
      await doTheWizard(args.project)
    } else {
      if (!args.project) {
       console.error(chalk.red('ERROR: Missing project name'));
      } else if (args.project.startsWith('-')) {
        console.error(chalk.red('ERROR: Unknown Argument: ' + args.project));
      } else {

        flags.workspace = flags.workspace ? flags.workspace : args.project;
        ProjectManager.getInstance().createProject(args.project, flags.workspace, flags['single-schema']);

      }
    }
  }
}

async function doTheWizard(projectName:string | undefined) {
  // read project and env to show current values
  let prj:any = fs.existsSync("xcl.yml") ? yaml.parse(fs.readFileSync("xcl.yml").toString()) : { xcl: {project: projectName} };
  let env:any = fs.existsSync(".xcl/env.yml") ? yaml.parse(fs.readFileSync(".xcl/env.yml").toString()) : { };

  await inquirer.prompt([{
      name: 'project',
      message: `Please give a project name`,
      type: 'input',
      default: prj.xcl.project
    },
    {
      name: 'multi',
      message: `Would you like to have a single or multi scheme app`,
      type: 'list',
      choices: ['Multi', 'Single'],
      default: toInitCapProjectType(prj.xcl.mode as string)
    },
    {
      name: 'workspace',
      message: `Enter workspace name`,
      type: 'input',
      default: prj.xcl.workspace || prj.xcl.project
    },
    {
      name: 'connection',
      message: `Enter database connections`,
      type: 'input',
      default: env.connection || 'localhost:1521/xepdb1'
    },
    {
      name: 'password',
      message: `Enter password for deployment user (Multi) or app user (Single)`,
      type: 'password'
    },
    {
      name: 'adminpass',
      message: `Enter password for admin user. Leave blank and you will be prompted when needed`,
      type: 'password'
    }
    ],
  ).then((answer) => {
    ProjectManager.getInstance().createProjectFromConfig(answer);
  });
}

function toInitCapProjectType(pString:string):string {
  return pString ? pString[0].toUpperCase() + pString.slice(1) : "Multi";
}

export interface ProjectWizardConfiguration {
  project:    string;
  multi:      string;
  workspace:  string;
  connection: string;
  password:   string;
  adminpass:  string;
  features:   string[];
  deployment: string;
}