import { Command, Flags } from '@oclif/core'
import { ProjectManager } from '../../lib/ProjectManager'
import { FeatureManager } from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment'
import chalk from 'chalk'
import { cli } from 'cli-ux';
import inquirer = require('inquirer')

export default class ProjectDeploy extends Command {
  static description = 'deploy the project'

  static flags = {
    help:                                                 Flags.help({char: 'h'}),
    connection:                                           Flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true, default: Environment.readConfigFrom(process.cwd(),"connection", false)}),
    password:                                             Flags.string( {char: 'p', description:'Password for Deployment User'} ),
    dependencies:                                         Flags.boolean({char: 'd', description:'Deploy inclusive dependencies (you will be asked for sys-user password)'}),
    syspw:                                                Flags.string({char:'s', description:'Provide sys-password for silent mode dependency installation [IMPORTANT: All existing users will be overwritten!]'}),
    'schema-only':                                        Flags.boolean({description:'Deploys only schema objects', default: false}),
    mode:                                                 Flags.string({char:         'm',
                                                                       description:  'mode of build (init/patch/dev)',
                                                                       default:      'dev'}),
    version:                                              Flags.string({char:        'v',
                                                                       description: 'version to deploy'}),
    yes:                                                  Flags.boolean({char:'y', description: 'Automatic proceed to the next schema without asking'}),
    'ords-url':                                           Flags.string({description: '[IP/SERVERNAME]:PORT', default: Environment.readConfigFrom(process.cwd(),'ords', false)}),
    'schema':                                             Flags.string({description: 'to deploy a single schema type one of the following: [data, logic, app]', default: Environment.readConfigFrom(process.cwd(), "schema", false)}),
    'quiet':                                              Flags.boolean({description: 'suppress output', default: false}),
    'nocompile':                                          Flags.boolean({description: 'ignore invalid objects on deploy', default: false})
  }

  static args = [{name: 'project', description: 'Name of the project that should be deployed', default: Environment.readConfigFrom( process.cwd(), "project", false) }]

  async run() {
    const {args, flags} = await this.parse(ProjectDeploy);
    if (!args.project && ProjectManager.getInstance().getProjectNameByPath(process.cwd()) === 'all'){
      console.log(chalk.red('ERROR: You must specify a project or be in a xcl-Project directory!'));
      console.log(chalk.blueBright('INFO: Try ´xcl project:list´ to get an overview of your projects!'));
    }else{

      if (!args.project){
        args.project=ProjectManager.getInstance().getProjectNameByPath(process.cwd());
      }

      if (!flags.password){
        let envPassword = Environment.readConfigFrom(process.cwd(), 'password');
        flags.password = envPassword ? envPassword :  (await inquirer.prompt([{
                                                                              type: 'password',
                                                                              name: 'password',
                                                                              message: `Insert deploy user password: `,
                                                                              mask: true
                                                                            }])).password;
      }

      if(ProjectManager.getInstance().getProject((args.project)).getDeployMethod()!==""){

        if (flags.dependencies && !flags.syspw){
          let syspw=await cli.prompt('sys', {type: 'hide'});
          await FeatureManager.getInstance().installAllProjectFeatures(args.project, flags.connection, syspw, false);
        }else{
          if (flags.dependencies){
            await FeatureManager.getInstance().installAllProjectFeatures(args.project, flags.connection, flags.syspw!, true);
          }
        }

        ProjectManager.getInstance().deploy(args.project, flags.connection, flags.password!, flags["schema-only"], flags['ords-url'], flags.yes, flags.version!, flags.mode, flags.schema, flags.nocompile);

      }else{
        console.log(chalk.red("ERROR: Deploy-Method undefined!"));
        console.log(chalk.yellow("INFO: xcl feature:list DEPLOY -a to get an overview about deployment methods"));
      }
    }

    console.log('Needed : ' + process.uptime().toPrecision(2) + 's');
  }
}
