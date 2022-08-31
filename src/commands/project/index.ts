import {Command} from '@oclif/core'

export default class ProjectDefault extends Command {
  static description = 'setup or manage your project'

  static examples = [
    `$ xcl project [apply|build|create|deploy|list|plan|remove|reset]`,
  ]

  async run(): Promise<void> {
    const {args} = await this.parse(ProjectDefault)
    console.log('Example: ');
    console.log(ProjectDefault.examples[0]);
  }
}