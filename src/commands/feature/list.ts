import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'

export default class FeatureList extends Command {
  static description = 'lists all available Features'

  static flags = {
    help: flags.help({char: 'h'})
  }

  static args = []

  async run() {
    const {args, flags} = this.parse(FeatureList)
    FeatureManager.getInstance().listFeatures();
   
  }
}
