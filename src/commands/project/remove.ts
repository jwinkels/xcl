import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectRemove extends Command {
  static description = 'removes project'

  static flags = {
    help: flags.help({char: 'h'}),
        
    path: flags.boolean({char: 'p'}),
    database: flags.boolean({char: 'd'})
  }

  static args = [
    {
      name: 'project',
      description: 'name of the project to remove',
      required: true
    }
  ]

  async run() {
    const {args, flags} = this.parse(ProjectRemove)

    ProjectManager.getInstance().removeProject(args.project, flags.path, flags.database);
  }
}
