import {Command, Flags} from '@oclif/core'
import {ProjectManager} from '../../lib/ProjectManager'
import { Environment } from '../../lib/Environment'
import chalk from 'chalk';
import { Git } from '../../lib/Git';
import inquirer from "inquirer";

export default class ProjectBuild extends Command {
  static description = 'create build to deploy'

  static flags =  {
    help:     Flags.help({char: 'h'}),
    mode:     Flags.string({char: 'm',
                            description: 'mode of build (init/patch)'
              }),
    version:  Flags.string({char: 'v',
                            description: 'Version to tag build'
              }),
    commit:   Flags.string({char: 'c',
                            description: 'commit or tag to build the deliverable',
                            required: false
              })
  }

  static args = [{
                  name: 'project',
                  description: "name of the project that should be build",
                  default: Environment.readConfigFrom(process.cwd(), "project", false)
                }]

  async run() {
    const {args, flags} = await this.parse(ProjectBuild)

    if (!flags.version){
      let answer = await inquirer.prompt([
        {
          name: 'mode',
          message: 'Please select build mode',
          type: 'list',
          choices: ['init', 'patch'],
          default: 'init'
        }]
      );

      let versionAnswer = await inquirer.prompt([
        {
          name: 'version',
          message: `Please insert a version number`,
          type: 'input',
          default: await Git.getLatestTagName() ? await Git.getLatestTagName() : answer.mode
        },
        {
          name: 'tag',
          message: 'Please insert the commit id or tag name of the build',
          type: 'list',
          choices: await Git.getTagList(),
          default: await Git.getLatestTagName() == "" ? await Git.getLatestTagName() : await Git.getCurrentCommitId()
        }]
      );
      
      flags.version = versionAnswer.version;
      flags.commit  = versionAnswer.tag;
      flags.mode    = answer.mode;
    }

    if ( ProjectManager.getInstance().getProjectNameByPath(process.cwd()) !== 'all' ){
      ProjectManager.getInstance().build(ProjectManager.getInstance().getProjectNameByPath(process.cwd()), flags.version!, flags.mode!, flags.commit);
    }else{
      if ( args.project ){
        ProjectManager.getInstance().build(args.project, flags.version!, flags.mode!, flags.commit);
      }else{
        console.log(chalk.red('ERROR: You must specify a project or be in a xcl-Project managed directory!'));
      }
    }
  }
}
