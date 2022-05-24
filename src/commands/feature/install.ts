import {Command, Flags} from '@oclif/core'
import { FeatureManager } from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment'
import  chalk from 'chalk'
import { FeatureType } from '../../lib/Feature'

export default class FeatureInstall extends Command{

  static description = 'install a Feature to target Schema'

  static flags = {
    help:       Flags.help( {char: 'h'}),
    connection: Flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', default: Environment.readConfigFrom(process.cwd(),"connection", false)} ),
    syspw:      Flags.string( {char: 's', description:'Password of SYS-User'})
  }

  static args = [
        {
          name: 'feature',
          description: 'Name of the Project-Feature to be installed',
          required: true
        },
        {
          name: 'project',
          description: 'name of the Project (when not in a xcl-Project path)',
          required: true,
          default: Environment.readConfigFrom(process.cwd(),"project")
        }
      ]

  async run() {
    const {args, flags} = await this.parse(FeatureInstall);
    if ((FeatureManager.getInstance().getFeatureType(args.feature, args.project) === FeatureType.DB ||
         FeatureManager.getInstance().getFeatureType(args.feature, args.project) === FeatureType.CUSTOM ) 
         && (!flags.connection || flags.connection === "")){
      console.log(chalk.red("ERROR: Provide a connection string to install "+args.name));
    }else{
      FeatureManager.getInstance().installProjectFeature(args.feature, flags.connection, flags.syspw!,args.project);
    }
  }
}
