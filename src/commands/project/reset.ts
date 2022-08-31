import {Command, Flags} from '@oclif/core'
import { Environment } from '../../lib/Environment'
import { ProjectManager } from '../../lib/ProjectManager'
import { Project } from '../../lib/Project'
import { Git } from '../../lib/Git'
import chalk from 'chalk';
import inquirer from "inquirer";

export default class ProjectReset extends Command {
  static description = 'reset project to commit id or tag'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    help:       Flags.help({char: 'h'}),
    yes:        Flags.boolean({char: 'y', description: 'proceed without confirmation'})
  }

  static args = [
    {
      name: 'commit',
      description: 'commit id or tag name',
      default: (async ()=>{return ( await Git.getPreviousTagName()) ? ( await Git.getPreviousTagName()) : "" })
    },
    {
      name: 'project',
      description: "name of the project that should be build",
      default: Environment.readConfigFrom(process.cwd(), "project", false)
    }
  ]

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ProjectReset);
    const project:Project = ProjectManager.getInstance().getProject(args.project);
    let commit:string = '';
    if (!args.commit){
      commit = project.getStatus().getResetCommitId();
    }else{
      commit = args.commit;
    }
    
    let commitId:string = commit !== '' ? await Git.isValidCommit(commit) : '';
    if(commitId!==''){
      let proceed:boolean = false;
      if(!flags.yes){
        let answer =  await inquirer.prompt([
          {
            name: 'confirm',
            message: `Are you sure to reset local status commit to:  ${commitId}`,
            type: 'confirm'
          }]
        );

        proceed = answer.confirm;
      }else{
        proceed = flags.yes;
      }

      if(proceed){
        project.getStatus().setCommitId(commitId);
        console.log(chalk.green('OK'));
      }else{
        console.log(chalk.yellow('canceled'));
      }
    }else{
      console.log(chalk.red('Not a valid commit or tag'));
    }
  }
}
