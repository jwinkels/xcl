import {Command, flags} from '@oclif/command'
import chalk from 'chalk'
import { FeatureManager } from '../../lib/featureManager'

export default class FeatureRemove extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    deinstall: flags.boolean( {char: 'd', description: 'Deinstall Feature from Database', default: true}),
    connection: flags.string( {char: 'c', description: 'Connection to Database(Required when Option -d)'} ),
    syspw: flags.string( {char: 'p', description: 'Password of SYS-User'}),
    owner: flags.boolean ( {char: 'o', description: 'drop Feature owner schema'} )
  }

  static args = [
    {
      name: 'feature',
      description: 'Name of the Project-Feature to be installed',
      required: true          
    },
    {
      name: 'project',
      description: 'name of the Project (when not in a xcl-Project path)'
    }
  ]

  async run() {
    const {args, flags} = this.parse(FeatureRemove)

    if (flags.deinstall && (flags.connection === undefined || flags.syspw === undefined)){
      console.log(chalk.red('Please provide a connection and the SYS-User password!'));
    }else{
      await FeatureManager.getInstance().deinstallProjectFeature(args.feature, flags.connection!, flags.syspw!, args.project);
      if (flags.owner){
        await FeatureManager.getInstance().dropOwnerSchema(args.feature, flags.connection!, flags.syspw!, args.project);
      }
    }
    await FeatureManager.getInstance().removeFeatureFromProject(args.feature, args.project);
  }
}
