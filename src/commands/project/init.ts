import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'
import * as path from 'path'
import { Environment } from '../../lib/Environment'

export default class ProjectInit extends Command {
  static description = 'initialize a project'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    //username: flags.string({char: 'u', description: 'machine or ip of database'}),
    password: flags.string({char: 'p', description: 'Password of user sys'}),
    connect: flags.string({char: 'c', description: 'Connectstring ex. localhost:1521/xepdb1', default: Environment.readConfigFrom(process.cwd(),"connection")}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f', description: 'Attention: forces dropping existing schemas'}),
    yes: flags.boolean({char: 'y', description: 'Answers force-action with yes (Use with caution)'}),
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
      args.project = path.basename(path.resolve(process.cwd()));
    }
    
    ProjectManager.getInstance().initializeProject(args.project, flags)
  }
}

