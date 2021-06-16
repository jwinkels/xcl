import {Command, flags} from '@oclif/command'
import { FeatureManager } from '../../lib/FeatureManager'
import { Environment } from '../../lib/Environment';

export default class FeatureDeinstall extends Command {
  static description = 'deinstall a Feature from Database'

  static flags = {
    help: flags.help({char: 'h'}),
    connection: flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true} ),
    syspw: flags.string( {char: 's', description:'Password of SYS-User', required: true}),
    owner: flags.boolean ( {char: 'o', description: 'drop owner schema'} )
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
    const {args, flags} = this.parse(FeatureDeinstall)
    await FeatureManager.getInstance().deinstallProjectFeature(args.feature, flags.connection, flags.syspw ,args.project);
    if (flags.owner){
      FeatureManager.getInstance().dropOwnerSchema(args.feature, flags.connection, flags.syspw ,args.project);
    }
  }
}
