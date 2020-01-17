import {Command, flags} from '@oclif/command'

export default class ProjectList extends Command {
  static description = 'list a project'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(ProjectList)

    const name = flags.name || 'world'
    this.log(`hello ${name} from C:\\Users\\jaw\\Projekte\\xcl-type\\xcl\\src\\commands\\project\\list.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
