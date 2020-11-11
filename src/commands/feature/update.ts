import {Command, flags} from '@oclif/command'
import { FeatureManager } from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/projectManager'
import { Environment } from '../../lib/Environment'

export default class FeatureUpdate extends Command {
  static description = 'update Project Feature version'

  static flags = {
    help: flags.help({char: 'h', description: 'shows this help'}),
    connection: flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true, default: Environment.readConfigFrom(process.cwd(),"connection")} ),
    syspw: flags.string( {char: 'p', description:'Password of SYS-User'})
  }

  static args = [
    {
      name: 'feature',
      description: 'Name of the Project-Feature to be installed',
      required: true          
    },
    {
      name: 'version',
      description: 'Version of the Feature',
      required: true
    },
    {
      name: 'project',
      description: 'name of the Project (when not in a xcl-Project path)',
      default: Environment.readConfigFrom(process.cwd(),"project")
    }
  ]

  async run() {
    const {args, flags} = this.parse(FeatureUpdate)
    
    FeatureManager.updateFeatureVersion(args.feature, args.version, args.project, flags.connection, flags.syspw!);
  }
}
