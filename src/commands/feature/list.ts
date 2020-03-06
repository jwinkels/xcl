import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/projectManager'

export default class FeatureList extends Command {
  static description = 'lists all available Features'

  static flags = {
    help: flags.help({char: 'h'}),
    project: flags.string({char: 'p', description: 'Shows all Features of a Project', required:true, default: ProjectManager.getInstance().getProjectNameByPath(process.cwd())}),
    all: flags.boolean({char: 'a', description: 'Show all Features available'}),
  }

  static args = [ ]

  async run() {
    const {args, flags} = this.parse(FeatureList);
    if (flags.project!=='all' && !flags.all){
      FeatureManager.getInstance().listProjectFeatures(flags.project);
    }else{
      FeatureManager.getInstance().listFeatures();
    }
  }
}
