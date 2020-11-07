import {Command, flags} from '@oclif/command'
import { ProjectManager } from '../../lib/ProjectManager'
import chalk from 'chalk';
import { Environment } from '../../lib/Environment';

export default class ProjectApply extends Command {
  static description = 'describe the command here'

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
    const {args, flags} = this.parse(ProjectApply);

    if ( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ) !== 'all' ){
      ProjectManager.getInstance().apply( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ) );
    }else{
      if ( args.project ){
        ProjectManager.getInstance().apply( args.project );
      }else{
        console.log( chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!') );
      }
    }
  }
}
