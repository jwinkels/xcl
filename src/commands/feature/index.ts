import {Command, Flags} from '@oclif/core'

export default class FeatureDefault extends Command {
  static description = 'add, remove or update a feature'

  static examples = [
    `$ xcl feature [add|deinstall|install|list|remove|update|versions] #FEATURE#`,
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(FeatureDefault)
  }
}