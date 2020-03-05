import {Command, flags} from '@oclif/command'
import { FeatureManager } from '../../lib/featureManager'

export default class FeatureInstall extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = [
        {
          name: 'feature',
          description: 'Name of the Project-Feature to be installed',
          required: true          
        },
        {
          name: 'connection',
          description: 'JDBC Connection String (SQLcl Connection String)',
          required: true
        },
        {
          name: 'project',
          description: 'name of the Project (when not in a xcl-Project path)'
        }
      ]

  async run() {
    const {args, flags} = this.parse(FeatureInstall)
    FeatureManager.getInstance().installProjectFeature(args.feature, args.connection, args.project);
  }
}
