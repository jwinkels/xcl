import {Command, Flags, CliUx} from '@oclif/core'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectRemove extends Command {
  static description = 'removes a project'

  static flags = {
    help:       Flags.help({char: 'h'}),   
    path:       Flags.boolean({char: 'p'}),
    database:   Flags.boolean({char: 'd'}),
    connection: Flags.string({char: 'c'}),
    syspw:      Flags.string({char: 's'})
  }

  static args = [
    {
      name:        'project',
      description: 'name of the project to remove',
      required:    true
    }
  ]

  async run() {
    const {args, flags} = await this.parse(ProjectRemove)

    let syspw = !flags.syspw ? "" : flags.syspw;
    let connection = !flags.connection ? "" : flags.connection;

    if (flags.database && ! flags.syspw){
      syspw=await CliUx.ux.prompt('sys', {type: 'hide'});
    }

    if (flags.database && !flags.connection){
      connection=await CliUx.ux.prompt('JDBC Connection String',{type: 'normal'});
    }

    ProjectManager.getInstance().removeProject(args.project, flags.path, flags.database, connection, syspw);
  }
}
