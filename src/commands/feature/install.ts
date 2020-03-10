import {Command, flags} from '@oclif/command'
import { FeatureManager } from '../../lib/featureManager'

export default class FeatureInstall extends Command {
  static description = 'install a Feature to target Schema'

  static flags = {
    help: flags.help({char: 'h'}),
    connection: flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true} ),
    syspw: flags.string( {char: 'p', description:'Password of SYS-User', required: true})
  }

  static args = [
        {
          name: 'feature',
          description: 'Name of the Project-Feature to be installed',
          required: true          
        },
        {
          name: 'project',
          description: 'name of the Project (when not in a xcl-Project path)'
        }
      ]

  async run() {
    const {args, flags} = this.parse(FeatureInstall)
    FeatureManager.getInstance().installProjectFeature(args.feature, flags.connection, flags.syspw ,args.project);
  }
}
