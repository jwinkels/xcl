import {Command, Flags} from '@oclif/core'
import { ProjectManager } from '../../lib/ProjectManager'
import chalk from 'chalk';
import { Environment } from '../../lib/Environment';

export default class ProjectApply extends Command {
  static description = 'apply a plan to a project'

  static flags = {
    help:         Flags.help   ({char: 'h'})
  }

  static args = [
    {
      name: 'project',
      description: "name of the project that a plan should be applied to",
      default: Environment.readConfigFrom( process.cwd(), "project", false )
    }
  ]

  async run() {
    const {args, flags} = await this.parse(ProjectApply);

    if ( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ) !== 'all' ){
      ProjectManager.getInstance().apply( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ));
    }else{
      if ( args.project ){
        ProjectManager.getInstance().apply( args.project);
      }else{
        console.log( chalk.red('ERROR: You must specify a project or be in a xcl-Project managed directory!') );
      }
    }
  }
}
