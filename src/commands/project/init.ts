import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'
import * as path from 'path'

export default class ProjectInit extends Command {
  static description = 'initialize a project'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    //username: flags.string({char: 'u', description: 'machine or ip of database'}),
    password: flags.string({char: 'p', description: 'Password of user sys'}),
    connect: flags.string({char: 'c', description: 'Connectstring ex. localhost:1521/xepdb1'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [
    {
      name: 'project',
      description: 'name of the project to initialze'      
    }
  ]

  async run() {
    const {args, flags} = this.parse(ProjectInit)
    
    if (!args.project) {
      args.project = path.basename(path.resolve(process.cwd()));
    }
    ProjectManager.getInstance().initializeProject(args.project, flags)
  }
}

