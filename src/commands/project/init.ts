import {Command, Flags} from '@oclif/core'
import {ProjectManager} from '../../lib/ProjectManager'
import * as path from 'path'
import { Environment } from '../../lib/Environment'

export default class ProjectInit extends Command {
  static description = 'initializes a project'

  static flags = {
    help:       Flags.help({char: 'h'}),
    syspw:      Flags.string({char: 's', description: 'Password of user sys'}),
    connection: Flags.string({char: 'c', description: 'Connectstring ex. localhost:1521/xepdb1', default: Environment.readConfigFrom( process.cwd(),"connection", false) }),
    force:      Flags.boolean({char: 'f', description: 'Attention: force will drop existing schemas'}),
    yes:        Flags.boolean({char: 'y', description: 'Answers force-action with yes (Use with caution)'}),
    objects:    Flags.boolean({char: 'o', description: 'Install basic objects defined in setup directory'}),
    users:      Flags.boolean({char: 'u', description: 'Install standard schemas APP, LOGIC, DATA, DEPL'}),
  }

  static args = [
    {
      name: 'project',
      description: 'name of the project to initialze',
      default: Environment.readConfigFrom(process.cwd(),"project")
    }
  ]

  async run() {
    const {args, flags} = await this.parse(ProjectInit)

    // Wenn kein Projekt angegeben wurde gehen wir davon aus, das der letzte Teil des
    // aktuellen Pfads, der Projektname ist
    if (!args.project) {
      args.project = path.basename( path.resolve( process.cwd() ) );
    }

    ProjectManager.getInstance().initializeProject(args.project, flags)
  }
}
