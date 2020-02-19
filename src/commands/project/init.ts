import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectInit extends Command {
  static description = 'initialize a project'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    machine: flags.string({char: 'm', description: 'machine or ip of database'}),
    port: flags.string({char: 'p', description: 'port where the listener works on'}),
    service: flags.string({char: 's', description: 'servie/sid of the database'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [
    {
      name: 'project',
      description: 'name of the project to initialze',
      required: true
    }
  ]

  async run() {
    const {args, flags} = this.parse(ProjectInit)
    
    ProjectManager.getInstance().initializeProject(args.project, flags)
  }
}

