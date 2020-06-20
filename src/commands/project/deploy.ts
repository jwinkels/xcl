import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectDeploy extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    connection: flags.string( {char: 'c', description:'connection string HOST:PORT/SERVICE_NAME', required: true}),
    password: flags.string( {char: 'p', description:'Password for Deployment User', required: true} )
  }

  static args = [{name: 'project'}]

  async run() {
    const {args, flags} = this.parse(ProjectDeploy);
    ProjectManager.getInstance().deploy(args.project, flags.connection, flags.password);
    
  }
}
