import {Command, flags} from '@oclif/command'
import { Environment } from '../../lib/Environment'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectCreate extends Command {
  static description = 'create a project'

  static flags = {
    help: flags.help({char: 'h'}),
    workspace: flags.string({char: 'w', description: 'workspace name the application should be installed in', default: Environment.readConfigFrom(process.cwd(),'project')}),
    "single-schema" : flags.boolean ({description: 'one schema instead of three, no deployment user'})
  }

  static args = [
                  {
                    name: 'project',
                    description: 'name of the project to create',
                    required: true
                  }
                ]

  async run() {
    const {args, flags} = this.parse(ProjectCreate)
    if(flags.workspace){
      ProjectManager.getInstance().createProject(args.project, flags.workspace, flags['single-schema']);
    }else{
      ProjectManager.getInstance().createProject(args.project, args.project, flags['single-schema']);
    }   
  }
}
