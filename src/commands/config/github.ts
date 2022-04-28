import {Command, Flags} from '@oclif/core'
import {GithubCredentials} from '../../lib/GithubCredentials';

export default class ConfigGithub extends Command {
  static description = 'Save Github credentials to avoid max API-Call Problems'

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  static args = [{name: 'user', required: true}]

  async run() {
    const {args, flags} = await this.parse(ConfigGithub);
    if (args.user){
      GithubCredentials.oauth(args.user);
    }
  }
}
