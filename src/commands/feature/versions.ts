import {Command, flags} from '@oclif/command'
import {FeatureManager} from '../../lib/FeatureManager'
const Table = require('cli-table');
import chalk from 'chalk'

export default class FeatureVersions extends Command {
  static description = 'lists all available Releases of the Feature'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{
                  name: 'feature',
                  description: 'name of the feature',
                  required: true
                }];

  async run() {
    const {args} = this.parse(FeatureVersions)
    const table = new Table({
      head: [        
        chalk.blueBright(args.feature)
      ]
    });

    let versions:string[] = await (await FeatureManager.getInstance().getFeatureReleases(args.feature));
    for (let i=0; i<versions.length-1; i++){
      table.push([versions[i]]);
    }

    console.log(table.toString());
  }
}
