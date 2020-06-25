import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'
import { cli } from 'cli-ux';

export default class ProjectRemove extends Command {
  static description = 'removes project'

  static flags = {
    help: flags.help({char: 'h'}),
        
    path: flags.boolean({char: 'p'}),
    database: flags.boolean({char: 'd'}),
    connection: flags.string({char: 'c'}),
    syspw: flags.string({char: 'p'})
  }

  static args = [
    {
      name: 'project',
      description: 'name of the project to remove',
      required: true
    }
  ]

  async run() {
    const {args, flags} = this.parse(ProjectRemove)

    let syspw = !flags.syspw ? "" : flags.syspw;
    let connection = !flags.connection ? "" : flags.connection;

    if (flags.database && ! flags.syspw){
      syspw=await cli.prompt('sys', {type: 'hide'});
    }

    if (flags.database && !flags.connection){
      connection=await cli.prompt('JDBC Connection String',{type: 'normal'});
    }

    ProjectManager.getInstance().removeProject(args.project, flags.path, flags.database, connection, syspw);
  }
}
