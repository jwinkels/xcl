import {Command, flags} from '@oclif/command'
import * as readline from 'readline-sync';
import {GithubCredentials} from '../../lib/GithubCredentials';

export default class ConfigGithub extends Command {
  static description = 'Save Github credentials to avoid max API-Call Problems'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'user', required: true}]

  async run() {
    const {args, flags} = this.parse(ConfigGithub);
    GithubCredentials.oauth(args.user);
  }
}
