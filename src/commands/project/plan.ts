import {Command, flags} from '@oclif/command'
import { Environment } from '../../lib/Environment'
import { ProjectManager } from '../../lib/ProjectManager'
import chalk from 'chalk';
import { cli } from 'cli-ux';

export default class ProjectPlan extends Command {
  static description = 'generate commands to bring the project up to date'

  static flags = {
    help: flags.help({char: 'h'}),
    "auto-apply": flags.boolean({description: "proceed with apply after plan", default: false}),
    "yes": flags.boolean({description: "skip all prompts with answer 'yes'", default: false}),
  }

  static args = [
      {
        name: 'project',
        description: "name of the project",
        default: Environment.readConfigFrom( process.cwd(), "project" , false)
      }
    ]

  async run() {
    const {args, flags} = this.parse(ProjectPlan);
    if ( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ) !== 'all' ){
      await ProjectManager.getInstance().plan( ProjectManager.getInstance().getProjectNameByPath( process.cwd() ));
    }else{
      if ( args.project ){
        await ProjectManager.getInstance().plan( args.project);
      }else{
        console.log( chalk.red('ERROR: You must specify a project or be in a xcl-Project managed directory!') );
      }
    }

    if ( flags["auto-apply"] ){
      let answer:string = "n";

      if ( !flags.yes ){
       answer = await cli.prompt('Do you really want to proceed with the plan described above [y/n]');
      }

      if ( answer === 'y' || flags.yes ){
        ProjectManager.getInstance().apply(args.project);
      }
    }
    console.log('Needed : ' + process.uptime().toPrecision(2) + 's');
  }
}
