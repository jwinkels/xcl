import {Command, flags} from '@oclif/command'
import { Project } from '../../lib/Project'
import { ProjectManager } from '../../lib/ProjectManager'
import cli from 'cli-ux'
import chalk from 'chalk'
import { Environment } from '../../lib/Environment'
import e = require('express')
import { promises } from 'dns'
const Table = require('cli-table')

export default class ConfigDefaults extends Command {
  static description = 'set xcl environment variables'

  static flags = {
    help: flags.help({char: 'h'}),
    list: flags.boolean({char: 'l', description:'list environment variables'}),
    set: flags.string({char: 's', description:'set the value of an environment variable'}),
    "set-all": flags.boolean({description:'set all available environment variables'}),
    reset: flags.string({char: 'r', description: 'resets an environment variable'}),
    "reset-all": flags.boolean({description: 'resets all environment variables'})
  }

  static args = [{name: 'project'},
                  {name: 'value'}]

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
          this.setVariable(flags.set, project, args.value);
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

  async setVariable(variableName:string, project:Project, value:string){
    let input = value ? value : await cli.prompt('Insert a value for "' + variableName!.toUpperCase() + '"');
    project.setEnvironmentVariable(variableName, input);
    console.log(chalk.green('\nOK'));
  }

  async listVariables(project:Project){
    const table = new Table({
      head: [
        chalk.blueBright('variable'),
        chalk.blueBright('value')
      ]
    });
    project.getEnvironment().forEach((value: string, key: string)=>{
      if ( key != 'syspw' ){
        table.push([key, value ? value : 'unset']);
      }else{
        table.push([key, value ? '*******' : 'unset']);
      }
    });
    console.log(table.toString());
  }

  async setAllVariables(project:Project){
    let variables:Map<string,string>=new Map<string,string>();

    let projectEnv=project.getEnvironment()
    for (let key of projectEnv.keys()){
      let input = await cli.prompt('Insert a value for "' + key.toUpperCase() + '"');
      project.setEnvironmentVariable(key, input);
      console.log(chalk.green('\nVariable ´'+key.toUpperCase()+'´ set!'));
    }
    console.log(chalk.green('OK'));
  }

  async resetVariable(variableName:string, project:Project){
    project.setEnvironmentVariable(variableName, "");
    console.log(chalk.green('OK'));
  }

  async resetAllVariables(project:Project){
    let variables:Map<string,string>=new Map<string,string>();

    let projectEnv=project.getEnvironment()
    for (let key of projectEnv.keys()){
      project.setEnvironmentVariable(key, "");
    }
    console.log(chalk.green('OK'));
  }

  async setGlobalVariable(variableName:string){
    let globals = Environment.initialize('all');
    let input = await cli.prompt('Insert a value for "' + variableName!.toUpperCase() + '"');
    //Braucht das ding sonst ist die ausgabe irgendwie unsauber
    console.log("");
    globals.set(variableName!, input);
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }

  async setAllGlobalVariables(){
    let globals = Environment.initialize('all');
    for (let key of globals.keys()){
      let input = await cli.prompt('Insert a value for "' + key.toUpperCase() + '"');
      console.log(chalk.green('\nVariable ´'+key.toUpperCase()+'´ set!'));
      globals.set(key, input);
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
        globals.forEach((value:string, key:string)=>{
          if ( key != 'syspw' ){
            table.push([ key, value ? value : 'unset']);
          }else{
            table.push([key, value ? '*******' : 'unset']);
          }
        });
        console.log(table.toString());
  }

  async resetGlobalVariable(variableName:string){
    let globals = Environment.initialize('all');
    globals.set(variableName,"");
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }

  async resetAllGlobalVariables(){
    let globals = Environment.initialize('all');
    for (let key of globals.keys()){
      globals.set(key, "");
    }
    Environment.writeEnvironment('all', globals);
    console.log(chalk.green('OK'));
  }


}
