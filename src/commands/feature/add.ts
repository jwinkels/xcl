import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/featureManager'

export default class FeatureAdd extends Command {
  static description = 'Add Feature to dependency list'

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u', required: true}),
    password: flags.string({char: 'p', required: true})
  }

  static args = [{
                  name: 'feature',
                  description: 'Name of the Feature to add',
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
              ];

  async run() {
    const {args, flags} = this.parse(FeatureAdd);
    FeatureManager.getInstance().addFeatureToProject(args.feature,args.version,args.project, flags.username, flags.password); 
  }
}
