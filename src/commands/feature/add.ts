import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
import { ProjectManager } from '../../lib/ProjectManager';
import chalk from 'chalk';
import cli from 'cli-ux';
import { Environment } from '../../lib/Environment';

export default class FeatureAdd extends Command {
  static description = 'add Feature to dependency list'

  static flags = {
    help: flags.help({char: 'h'})
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
                  name: 'username',
                  description: 'schema name for the feature to be installed in'
                },
                {
                  name: 'password',
                  description: 'password for the new schema'
                },
                {
                  name: 'project',
                  description: 'Name of the Project (when not in a xcl-Project path)',
                  default: Environment.readConfigFrom(process.cwd(),"project")              
                }
              ];

  async run() {
    const {args, flags} = this.parse(FeatureAdd);

    if(FeatureManager.getInstance().getFeatureType(args.feature)==="DB" && (!args.username || !args.password)){
      console.log(chalk.red("ERROR: You need to specify a username and a password to add this feature!"));
    }else{

      /*if(!args.version && args.feature){
        await FeatureManager.getInstance().getFeatureReleases(args.feature).then(async (success)=>{
          args.version= await cli.prompt('Please enter the version number from the list above you like to add: ');
        });
      }*/

      if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
        FeatureManager.getInstance().addFeatureToProject(args.feature,args.version, ProjectManager.getInstance().getProjectNameByPath(process.cwd()), args.username, args.password); 
      }else{
        if ( args.project ){
          FeatureManager.getInstance().addFeatureToProject(args.feature, args.version, args.project, args.username, args.password); 
        }else{
          console.log(chalk.red('ERROR: You need to specify a project or be in a xcl-Project managed directory!'));
        }
      }
    }
  }
}
