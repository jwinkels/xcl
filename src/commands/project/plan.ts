import {Command, flags} from '@oclif/command'
import { Environment } from '../../lib/Environment'
import { ProjectManager } from '../../lib/ProjectManager'
import chalk from 'chalk';

export default class ProjectPlan extends Command {
  static description = 'generate commands to bring the project up to date'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [
      {
        name: 'project',
        description: "The name of the project that should be build", 
        default: Environment.readConfigFrom( process.cwd(), "project" )
      }
    ]

  async run() {
    const {args, flags} = this.parse(ProjectPlan);
    if ( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ) !== 'all' ){
      ProjectManager.getInstance().plan( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ));
    }else{
      if ( args.project ){
        ProjectManager.getInstance().plan( args.project);
      }else{
        console.log( chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!') );
      }
    }
  }
}
