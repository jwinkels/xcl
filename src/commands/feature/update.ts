import {Command, flags} from '@oclif/command'
import { FeatureManager } from '../../lib/featureManager'

export default class FeatureUpdate extends Command {
  static description = 'update Project Feature version'

  static flags = {
    help: flags.help({char: 'h'}),
    connection: flags.string( {char: 'c', required: true} ),
    syspw: flags.string( {char: 'p', required: true})
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
      description: 'name of the Project (when not in a xcl-Project path)'
    }
  ]

  async run() {
    const {args, flags} = this.parse(FeatureUpdate)
    
    FeatureManager.updateFeatureVersion(args.feature, args.version, args.project, flags.connection, flags.syspw);
  }
}
