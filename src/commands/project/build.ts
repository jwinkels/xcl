import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'
import { Environment } from '../../lib/Environment'
import chalk from 'chalk';

export default class ProjectBuild extends Command {
  static description = 'create build to deploy'

  static flags =  {
    help: flags.help({char: 'h'}),
    mode: flags.string({char: 'm', 
                        description: 'mode of build (init/patch)', 
                        default: 'init'}),
    version: flags.string({char: 'v',
                          description: 'Version to tag build',
                          required: true})
  }

  static args = [{
                  name: 'project', 
                  description: "name of the project that should be build", 
                  default: Environment.readConfigFrom(process.cwd(),"project")
                }]

  async run() {    
    const {args, flags} = this.parse(ProjectBuild)

    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      ProjectManager.getInstance().build(ProjectManager.getInstance().getProjectNameByPath(process.cwd()), flags.version, flags.mode);
    }else{
      if ( args.project ){
        ProjectManager.getInstance().build(args.project, flags.version, flags.mode);
      }else{
        console.log(chalk.red('ERROR: You must specify a project or be in a xcl-Project managed directory!'));
      }
    }
    
  }
}
