import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectBuild extends Command {
  static description = 'create build to deploy'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [{name: 'project'},
                  {name: 'version'}]

  async run() {
    const {args, flags} = this.parse(ProjectBuild)

    ProjectManager.getInstance().build(args.project, args.version);
    
  }
}
