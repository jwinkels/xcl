import {Command, flags} from '@oclif/command'
import {ProjectManager} from '../../lib/ProjectManager'

export default class ProjectCreate extends Command {
  static description = 'create a project'

  static flags = {
    help: flags.help({char: 'h'}),
    workspace: flags.string({char: 'w'})    
  }

  static args = [
                  {
                    name: 'project',
                    description: 'name of the project to create',
                    required: true
                  }
                ]

  async run() {
    const {args, flags} = this.parse(ProjectCreate)
    if(flags.workspace){
      ProjectManager.getInstance().createProject(args.project, flags.workspace);
    }else{
      ProjectManager.getInstance().createProject(args.project, args.project);
    }
    

    
  }
}
