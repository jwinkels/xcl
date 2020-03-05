import {Command, flags} from '@oclif/command'
import * as readline from 'readline-sync';
import {GithubCredentials} from '../../lib/GithubCredentials';

export default class ConfigGithub extends Command {
  static description = 'Save Github credentials to avoid max API-Call Problems'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [{name: 'user'}]

  async run() {
    const {args, flags} = this.parse(ConfigGithub);
    var password=readline.question('Github-Account-Password['+args.user+']: ', {hideEchoBack: true});
    GithubCredentials.writeCredentials(new Buffer(args.user+':'+password).toString('base64'));
  }
}
