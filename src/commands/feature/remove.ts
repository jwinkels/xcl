import {Command, flags} from '@oclif/command'
import chalk from 'chalk'
import { FeatureManager } from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/ProjectManager'
import { Environment } from '../../lib/Environment'
export default class FeatureRemove extends Command {
  static description = 'remove Feature from Project'

  static flags = {
    help: flags.help({char: 'h'}),
    deinstall: flags.boolean( {char: 'd', description: 'deinstall Feature from database'}),
    connection: flags.string( {char: 'c', description: 'connection to database (required when deinstall Feature) [ HOST:PORT/SERVICE_NAME ]', default: Environment.readConfigFrom(process.cwd(),"connection")} ),
    syspw: flags.string( {char: 'p', description: 'password of SYS-User'}),
    owner: flags.boolean ( {char: 'o', description: 'drop Feature owner schema'} )
  }

  static args = [
    {
      name: 'feature',
      description: 'Name of the Project-Feature to be installed',
      required: true          
    },
    {
      name: 'project',
      description: 'Name of the Project (when not in a xcl-Project path)',
      default: Environment.readConfigFrom( process.cwd(), "project" ) 
    }
  ]

  async run() {
    const {args, flags} = this.parse(FeatureRemove)

    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) === 'all' &&  !args.project){
      console.log(chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!'));
    }else{
      let project="";

      if(ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
        project=ProjectManager.getInstance().getProjectNameByPath(process.cwd());
      }else{
        project=args.project;
      }

      if (project !== ""){
        if (flags.deinstall && (flags.connection === undefined || flags.syspw === undefined)){
          console.log(chalk.red('Please provide a connection and the SYS-User password!'));
        }else{
          if ( flags.deinstall && ( flags.connection && flags.syspw ) ){
            await FeatureManager.getInstance().deinstallProjectFeature(args.feature, flags.connection!, flags.syspw!, project);
          }else{
            if (flags.deinstall){
              throw Error(chalk.red('ERROR: When using deinstall option you need to provide a connection and the SYS-User password!'));
            }
          }

          if (flags.owner && ( flags.connection && flags.syspw ) ){
            await FeatureManager.getInstance().dropOwnerSchema(args.feature, flags.connection!, flags.syspw!, project);
          }else{
            if (flags.owner){
              throw Error(chalk.red('ERROR: When using drop owner schema option you need to provide a connection and the SYS-User password!'));
            }
          }
        }
        await FeatureManager.getInstance().removeFeatureFromProject(args.feature, project);
      }else{
        console.log(chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!'));
      }
    }
  }
}
