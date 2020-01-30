import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'

export default class FeatureVersions extends Command {
  static description = 'lists all available Releases of the Feature'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{
                  name: 'feature',
                  description: 'name of the feature',
                  required: true
                }];

  async run() {
    const {args, flags} = this.parse(FeatureVersions)
    FeatureManager.getInstance().getFeatureReleases(args.feature);
  }
}
