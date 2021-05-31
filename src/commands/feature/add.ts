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
                  name: 'username',
                  description: 'schema name for the feature to be installed in'
                },
                {
                  name: 'password',
                  description: 'password for the new schema'
                },
                {
                  name: 'version',
                  description: 'Version of the Feature',
                  required: false
                },
                {
                  name: 'project',
                  description: 'Name of the Project (when not in a xcl-Project path)',
                  default: Environment.readConfigFrom(process.cwd(),"project")              
                }
              ];

  async run() {
    const {args, flags} = this.parse(FeatureAdd);


    if(!args.version && args.feature){
      await FeatureManager.getInstance().getFeatureReleases(args.feature).then(async (success)=>{
        args.version= await cli.prompt('Please enter a version number from the list above you like to add');
      });
    }

    
    if(FeatureManager.getInstance().getFeatureType(args.feature) === "DB" && (!args.username || !args.password)){
      console.log(chalk.yellow("INFO: You must specify a username and a password to add this feature!"));
      args.username = await cli.prompt('Please enter a username');
      args.password = await cli.prompt('Please enter a password');
    }

    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      await FeatureManager.getInstance().addFeatureToProject(args.feature,args.version, ProjectManager.getInstance().getProjectNameByPath(process.cwd()), args.username, args.password); 
    }else{
      if ( args.project ){
        await FeatureManager.getInstance().addFeatureToProject(args.feature, args.version, args.project, args.username, args.password);
      }else{
        console.log(chalk.red('ERROR: You must specify a project or be in a xcl-Project managed directory!'));
      }
    }

    let install:string = await cli.prompt(`Install ${args.feature} [y/n]`);

    if (install === 'y'){
      let connection:string =Environment.readConfigFrom(process.cwd(),"connection");
      if (!connection){
        connection = await cli.prompt('Connection [host:port/servicename]');
      }
      let syspw:string = await cli.prompt('SYS-Password',{type: 'hide'});
      FeatureManager.getInstance().installProjectFeature(args.feature, connection, syspw, args.project);
    }else{
      console.log(chalk.blueBright('Feature was added! You can install it using feature:install'));
    }
  }
}
