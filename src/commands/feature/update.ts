import {Command, Flags} from '@oclif/core'
import { FeatureManager } from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment'
import cli from 'cli-ux';

export default class FeatureUpdate extends Command {
  static description = 'update Project Feature version'

  static flags = {
    help:       Flags.help({char: 'h', description: 'shows this help'}),
    connection: Flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true, default: Environment.readConfigFrom(process.cwd(),"connection", false)} ),
    syspw:      Flags.string( {char: 's', description:'Password of SYS-User'})
  }

  static args = [
    {
      name: 'feature',
      description: 'Name of the Project-Feature to be installed',
      required: true
    },
    {
      name: 'version',
      description: 'Version of the Feature',
      required: false
    },
    {
      name: 'project',
      description: 'name of the Project (when not in a xcl-Project path)',
      default: Environment.readConfigFrom(process.cwd(),"project")
    }
  ]

  async run() {
    const {args, flags} = await this.parse(FeatureUpdate)
    if(!args.version && args.feature){
      await FeatureManager.getInstance().getFeatureReleases(args.feature).then(async (success)=>{
        args.version= await cli.prompt('Please enter a version number from the list above you like to add');
      });
    }

    if (!flags.syspw){
      flags.syspw = await cli.prompt('SYS-Password',{type: 'hide'});
    }

    FeatureManager.updateFeatureVersion(args.feature, args.version, args.project, flags.connection, flags.syspw!);
  }
}
