import {Command, flags} from '@oclif/command'
import { Project } from '../../lib/Project'
import { ProjectManager } from '../../lib/ProjectManager'
import cli from 'cli-ux'
import chalk from 'chalk'
import { Environment } from '../../lib/Environment'
const Table = require('cli-table')

export default class ConfigDefaults extends Command{
  static description = 'set xcl environment variables'

  static flags = {
    help: flags.help({char: 'h'}),
    list: flags.boolean({char: 'l', description:'list environment variables'}),
    set: flags.string({char: 's', description:'set the value of an environment variable'}),
    "set-all": flags.boolean({description:'set all available environment variables'}),
    "set-required": flags.boolean({description:'set all required environment variables'}),
    reset: flags.string({char: 'r', description: 'resets an environment variable'}),
    "reset-all": flags.boolean({description: 'resets all environment variables'})
  }

  static args = [{name: 'project'}]

  async run() {
    const {args, flags} = this.parse(ConfigDefaults)
    let project:any = undefined;
    if (args.project){
      project = ProjectManager.getInstance().getProject(args.project);
    }else{
      args.project=ProjectManager.getInstance().getProjectNameByPath(process.cwd());
      if (args.project!="all"){
        project = ProjectManager.getInstance().getProject(args.project);
      }else{
        args.name="all";
      }
    }

    if (project!==undefined){
      if (flags.list){
        this.listVariables(project);
      }

      if(flags["set-all"]){
        this.setAllVariables(project);
      }else{
        if (flags.set && flags.set !==""){
          await this.setVariable(flags.set, project, args.value);
        }

        if(flags['set-required']){
          this.setRequiredVariables(project);
        }
      }

      if (flags.reset){
        if (flags.reset !==""){
          this.resetVariable(flags.reset, project);
        }else{
          console.log(chalk.red("ERROR: provide a variable name"));
        }
      }

      if (flags["reset-all"]){
        this.resetAllVariables(project);
      }
    }else{
      if (flags.list){
        this.listGlobalVariables();
      }
      
      if(flags["set-all"]){
          this.setAllGlobalVariables();
      }else{
        if (flags.set){
          this.setGlobalVariable(flags.set);
        }else{
          if(flags.set && flags.set ===""){
            console.log(chalk.red('ERROR: Please provide a variable name you want to set a value for'));
          }
        }
      }

      if (flags.reset){
        if (flags.reset !==""){
          this.resetGlobalVariable(flags.reset);
        }else{
          console.log(chalk.red("ERROR: provide a variable name"));
        }
      }

      if (flags["reset-all"]){
        this.resetAllGlobalVariables();
      }
    }
  }

  async setVariable(variableName:string, project:Project, value:string|undefined){
    let input = "";

    if (value && value.startsWith('$')){
      value = value.replace('$','');
      value = process.env[value]?.trim();

      //If System-Environment Variable was not found lookup xcl-Environment Variable
      if (!value || value === ""){
        value = project.getEnvironment().get(variableName)?.value;
      }
    }

    if (variableName.toUpperCase()==="SYSPW"){
      input = value ? value : await cli.prompt('Insert a value for "' + variableName.toUpperCase() + '"', {type: 'hide'});                                               
    }else{
      input = value ? value : await cli.prompt('Insert a value for "' + variableName.toUpperCase() + '"', {type: 'normal'});
    } 

    if (variableName.toUpperCase()==='SCHEMA' && project.getMode()===Project.MODE_SINGLE){
      input = 'app';
      console.log(chalk.yellow('SCHEMA variable must not be changed in single schema mode!'));
      console.log(chalk.yellow('Reset variable to: app'));
    }

    project.setEnvironmentVariable(variableName, input);
  }

  async listVariables(project:Project){
    const table = new Table({
      head: [
        chalk.blueBright('variable'),
        chalk.blueBright('value')
      ]
    });
    project.getEnvironment().forEach((variable: {value:string, required:boolean}, key: string)=>{
      if ( key != 'syspw' ){
        table.push([key, variable.value ? variable.value : 'unset']);
      }else{
        table.push([key, variable.value ? '*******' : 'unset']);
      }
    });
    console.log(table.toString());
  }

  async setAllVariables(project:Project){
    //let variables:Map<string,{value:string, required:boolean}>=new Map<string,{value:string, required:boolean}>();

    let projectEnv=project.getEnvironment();
    for (let key of projectEnv.keys()){
      let input = await cli.prompt('Insert a value for "' + key.toUpperCase() + '"');
      project.setEnvironmentVariable(key, input);
      console.log(chalk.green('\nVariable ´'+key.toUpperCase()+'´ set!'));
    }
    console.log(chalk.green('OK'));
  }

  async resetVariable(variableName:string, project:Project){
    project.setEnvironmentVariable(variableName, "", true);
  }

  async resetAllVariables(project:Project){
    
    let projectEnv=project.getEnvironment()
    for (let key of projectEnv.keys()){
      project.setEnvironmentVariable(key, "", true);
    }
    console.log(chalk.green('OK'));
  }

  async setGlobalVariable(variableName:string){
    let globals = Environment.initialize('all');
    let input = await cli.prompt('Insert a value for "' + variableName.toUpperCase() + '"');
    globals.set(variableName, input);
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }

  async setAllGlobalVariables(){
    let globals = Environment.initialize('all');
    for (let key of globals.keys()){
      let input = await cli.prompt('Insert a value for "' + key.toUpperCase() + '"');
      console.log(chalk.green('\nVariable ´'+key.toUpperCase()+'´ set!'));
      Environment.setVariable(key, input, globals);
    }
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }

  async listGlobalVariables(){
    console.log(chalk.yellow("Showing Global Variables: "));
        const table = new Table({
          head: [
            chalk.blueBright('variable'),
            chalk.blueBright('value')
          ]
        });
        let globals=Environment.initialize('all');
        globals.forEach((variable:{value:string, required:boolean}, key:string)=>{
          if ( key != 'syspw' ){
            table.push([ key, variable.value ? variable.value : 'unset']);
          }else{
            table.push([key, variable.value ? '*******' : 'unset']);
          }
        });
        console.log(table.toString());
  }

  async resetGlobalVariable(variableName:string){
    let globals = Environment.initialize('all');
    Environment.setVariable(variableName,  "", globals);
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }

  async resetAllGlobalVariables(){
    let globals = Environment.initialize('all');
    for (let key of globals.keys()){
      Environment.setVariable(key,  "", globals);
    }
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }

  async setRequiredVariables(project:Project){
    //let variables:Map<string,{value:string, required:boolean}>=new Map<string,{value:string, required:boolean}>();

    let projectEnv=project.getEnvironment();
    for (let key of projectEnv.keys()){
      if(projectEnv.get(key)?.required){
        let input = await cli.prompt('Insert a value for "' + key.toUpperCase() + '"', {default: projectEnv.get(key)?.value});
        project.setEnvironmentVariable(key, input);
        console.log(chalk.green('\nVariable ´'+key.toUpperCase()+'´ set!'));
      }
    }
    console.log(chalk.green('OK'));
  }

  public async runCommand(argv:string[]){
    return ConfigDefaults.run(argv);
  }

}
