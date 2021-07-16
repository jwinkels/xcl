import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment'

export default class FeatureList extends Command {
  static description = 'lists all available Features'

  static flags = {
    help: flags.help({char: 'h'}),
    all: flags.boolean({char: 'a', description: 'show all Features available'}),
  }

  static args = [ 
    
      {
        name: 'type',
        description: 'Show all Features of type [DB or DEPLOY]',
        default: 'ALL'
      },
      {
        name: 'project',
        description: 'Show Features added to a Project (when not in a XCL-Directory it shows all Features available)',
        default: Environment.readConfigFrom(process.cwd(),"project")
      }
   ]

  async run() {
    const {args, flags} = this.parse(FeatureList);
    if (args.project!=='all' && !flags.all){
      FeatureManager.getInstance().listProjectFeatures(args.project, args.type);
    }else{
      FeatureManager.getInstance().listFeatures(args.type);
    }
  }
}
