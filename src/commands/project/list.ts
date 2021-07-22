import {Command, flags} from '@oclif/command'
import { ProjectManager } from '../../lib/ProjectManager'


export default class ProjectList extends Command {
  static description = 'lists all known xcl projects'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = []

  async run() {
    ProjectManager.getInstance().listProjects();
  }
}
