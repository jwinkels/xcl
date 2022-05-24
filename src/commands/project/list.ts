import {Command, Flags} from '@oclif/core'
import { ProjectManager } from '../../lib/ProjectManager'


export default class ProjectList extends Command {
  static description = 'lists all xcl projects'

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  static args = []

  async run() {
    ProjectManager.getInstance().listProjects();
  }
}
