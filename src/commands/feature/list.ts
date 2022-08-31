import {Command, Flags} from '@oclif/core'
import {FeatureManager} from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment'

export default class FeatureList extends Command {
  static description = 'lists all available Features'

  static flags = {
    help: Flags.help({char: 'h'}),
    all:  Flags.boolean({char: 'a', description: 'show all Features available'}),
  }

  static args = [ 
    
      {
        name: 'type',
        description: 'Show all Features of type [DB or DEPLOY]',
        default: 'all'
      },
      {
        name: 'project',
        description: 'Show Features added to a Project (when not in a XCL-Directory it shows all Features available)',
        default: Environment.readConfigFrom(process.cwd(),"project") ? Environment.readConfigFrom(process.cwd(),"project") : 'all'
      }
   ]

  async run() {
    const {args, flags} = await this.parse(FeatureList);
    if (args.project!=='all' && !flags.all){
      FeatureManager.getInstance().listProjectFeatures(args.project, args.type);
    }else{
      FeatureManager.getInstance().listFeatures(args.type);
    }
  }
}
