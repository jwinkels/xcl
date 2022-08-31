import {Command, Flags} from '@oclif/core'
import { FeatureManager } from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment';

export default class FeatureDeinstall extends Command {
  static description = 'deinstall a Feature from Database'

  static flags = {
    help:       Flags.help({char: 'h'}),
    connection: Flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true} ),
    syspw:      Flags.string( {char: 's', description:'Password of SYS-User', required: true}),
    drop:       Flags.boolean ( {char: 'd', description: 'drop owner schema'} )
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
          default: Environment.readConfigFrom(process.cwd(),"project") 
        }
      ]

      
  async run() {
    const {args, flags} = await this.parse(FeatureDeinstall)
    await FeatureManager.getInstance().deinstallProjectFeature(args.feature, flags.connection, flags.syspw ,args.project);
    if (flags.drop){
      FeatureManager.getInstance().dropOwnerSchema(args.feature, flags.connection, flags.syspw ,args.project);
    }
  }
}
