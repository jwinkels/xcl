import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/ProjectManager';
import chalk from 'chalk';

export default class FeatureAdd extends Command {
  static description = 'add Feature to dependency list'

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u', description: 'schema name for the feature to be installed in', required: true}),
    password: flags.string({char: 'p', description: 'password for the new schema', required: true})
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
                  description: 'Name of the Project (when not in a xcl-Project path)'
                }
              ];

  async run() {
    const {args, flags} = this.parse(FeatureAdd);
    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      FeatureManager.getInstance().addFeatureToProject(args.feature,args.version, ProjectManager.getInstance().getProjectNameByPath(process.cwd()), flags.username, flags.password); 
    }else{
      if ( args.project ){
        FeatureManager.getInstance().addFeatureToProject(args.feature,args.version, args.project, flags.username, flags.password); 
      }else{
        console.log(chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!'));
      }
    }
  }
}
