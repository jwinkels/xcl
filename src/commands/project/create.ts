import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/projectManager'

export default class ProjectCreate extends Command {
  static description = 'create, list or remove a project'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: 'Name of the Project to be created'})
    // flag with no value (-f, --force)
    //force: flags.boolean({char: 'f'}),
  }

  static args = [{name: 'file'}]

  async run() {
    const {args, flags} = this.parse(ProjectCreate)

    /*const name = flags.name || 'world'
    this.log(`hello ${name} from C:\\Users\\mmi\\Projekte\\xcl\\src\\commands\\project\\create.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }*/

    if(flags.name){
      ProjectManager.getInstance(flags.name).createDirectoryStructure()
    }
  }
}
