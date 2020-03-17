import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/projectManager'

export default class FeatureList extends Command {
  static description = 'lists all available Features'

  static flags = {
    help: flags.help({char: 'h'}),
    project: flags.string({char: 'p', description: 'shows all Features of a Project', required:true, default: ProjectManager.getInstance().getProjectNameByPath(process.cwd())}),
    all: flags.boolean({char: 'a', description: 'show all Features available'}),
  }

  static args = [ 
      {
        name: 'type',
        description: 'Show all Features of type [DB or DEPLOY]',
        default: 'ALL'
      }
   ]

  async run() {
    const {args, flags} = this.parse(FeatureList);
    if (flags.project!=='all' && !flags.all){
      FeatureManager.getInstance().listProjectFeatures(flags.project, args.type);
    }else{
      FeatureManager.getInstance().listFeatures(args.type);
    }
  }
}
