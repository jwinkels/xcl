import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'
import * as path from 'path'
import { Environment } from '../../lib/Environment'

export default class ProjectInit extends Command {
  static description = 'initializes a project'

  static flags = {
    help: flags.help({char: 'h'}),
    syspw: flags.string({char: 's', description: 'Password of user sys'}),
    connection: flags.string({char: 'c', description: 'Connectstring ex. localhost:1521/xepdb1', default: Environment.readConfigFrom( process.cwd(),"connection", false) }),
    force: flags.boolean({char: 'f', description: 'Attention: force will drop existing schemas'}),
    yes: flags.boolean({char: 'y', description: 'Answers force-action with yes (Use with caution)'}),
    objects: flags.boolean({char: 'o', description: 'Install basic objects defined in setup directory'}),
    users: flags.boolean({char: 'u', description: 'Install standard schemas APP, LOGIC, DATA, DEPL'}),
  }

  static args = [
    {
      name: 'project',
      description: 'name of the project to initialze',
      default: Environment.readConfigFrom(process.cwd(),"project")
    }
  ]

  async run() {
    const {args, flags} = this.parse(ProjectInit)

    // Wenn kein Projekt angegeben wurde gehen wir davon aus, das der letzte Teil des
    // aktuellen Pfads, der Projektname ist
    if (!args.project) {
      args.project = path.basename( path.resolve( process.cwd() ) );
    }

    ProjectManager.getInstance().initializeProject(args.project, flags)
  }
}
