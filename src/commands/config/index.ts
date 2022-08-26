import {Command} from '@oclif/core'

export default class ConfigDefault extends Command {
  static description = 'config environment variables or github credentials'

  static examples = [
    `$ xcl config [default|github]`,
  ]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(ConfigDefault)
  }
}