import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'
import { Environment } from '../../lib/Environment'
import chalk from 'chalk';

export default class ProjectBuild extends Command {
  static description = 'create build to deploy'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [{
                  name: 'project', 
                  description: "The name of the project that should be build", 
                  default: Environment.readConfigFrom(process.cwd(),"project")
                },
                {name: 'version'}]

  async run() {
    const {args, flags} = this.parse(ProjectBuild)
    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      ProjectManager.getInstance().build(ProjectManager.getInstance().getProjectNameByPath(process.cwd()), args.version);
    }else{
      if ( args.project ){
        ProjectManager.getInstance().build(args.project, args.version);
      }else{
        console.log(chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!'));
      }
    }
    
  }
}
