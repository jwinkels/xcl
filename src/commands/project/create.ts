import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectCreate extends Command {
  static description = 'create, list or remove a project'

  static flags = {
    help: flags.help({char: 'h'}),    
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
    // flags kommen bestimmt noch...
    // -f force
    // - template?
    
    ProjectManager.getInstance().createProject(args.project)

    
  }
}
