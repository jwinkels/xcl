import * as fs from "fs-extra";
import  * as os from 'os';
import * as yaml from "yaml";
import { ProjectWizardConfiguration } from "../commands/project/create";
import { Project } from "./Project";
import { ProjectManager } from './ProjectManager';
export class Environment{
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";

    public static initialize(projectName:string, project:Project|undefined=undefined, schema:string = ''):Map<string,{value:string, required:boolean}>{

        //initialize variables
        let envFileName                                              = "";
        let env:any                                                  = {};
        let variables:Map<string,{value:string, required:boolean}>   = Environment.getVariablesMap(projectName, schema);
        const globals                                                = "environment.yml";
        const projectVariables                                       = "env.yml";

        // Decide which environment variables context should be loaded
        if(projectName.toLocaleLowerCase() !== "all" && project){
            // environment variable of project
            envFileName = project.getPath() + "/.xcl/" + projectVariables;
        }else{
            // globals
            envFileName = this.xclHome + globals;
        }

        // Check if environment variable file exists if not, write skelleton to file
        if(!fs.existsSync(envFileName)){
            if (fs.existsSync(this.xclHome + "/" + projectVariables) && project){
                fs.moveSync(this.xclHome + "/" + projectVariables, envFileName);
            }else{
                if (project !== undefined && fs.existsSync(project.getPath() + "/.xcl/environment_" + project.getName() + ".yml" ) ){
                    fs.renameSync(project.getPath() + "/.xcl/environment_" + project.getName() + ".yml", envFileName);
                }
                if (!fs.existsSync(envFileName)){
                    variables.forEach((variable: {value:string, required:boolean}, key)=>{
                        env[key] = variable.value;
                    });
                    fs.writeFileSync(envFileName,yaml.stringify(env));
                }
            }
        }

        return Environment.loadEnvironmentConfig(envFileName, variables);
    }

    private static loadEnvironmentConfig(envFileName:string, variables:Map<string, {value:string, required:boolean}>):Map<string,{value:string, required:boolean}>{
        
        let env:any = {}; 
        env         = yaml.parse(fs.readFileSync(envFileName).toString());

        variables.forEach((variable: {value:string, required:boolean}, key)=>{
            this.setVariable(key, env[key], variables);
        });

        return variables;
    }

    private static getVariablesMap(projectName:string, schema:string = ''):Map<string,{value:string, required:boolean}>{
        // Available environment variable declaration
        // List can be extended
        let variables:Map<string,{value:string, required:boolean}> = new Map<string, {value:string, required:boolean}>();
        variables.set('connection', {value: "unset", required: true});
        variables.set('project', {value: projectName !== "all" ? projectName : "", required: true});
        variables.set('syspw', {value:"", required: false});
        variables.set('password',{value:'', required: false});
        variables.set('ords',{value:"", required: false});
        variables.set('schema', {value: schema, required: false});
        return variables;
    }

    public static setVariable(variableName:string, value:string, variables:Map<string,{value:string, required:boolean}>):void{
        let variable:{value:string, required:boolean} = variables.get(variableName)!;
        variable.value = value;
        variables.set(variableName, variable);
    }

    public static writeEnvironment(projectName:string, variables:Map<string,{value:string, required:boolean}>){
        let envFileName="";
        let env:any={};

        // Decide which environment variables context should be written
        if (projectName.toLocaleLowerCase() !== "all"){
            let project:Project = ProjectManager.getInstance().getProject(projectName);
            envFileName = project.getPath() + "/.xcl/env.yml";
        }else{
            envFileName = this.xclHome + "/environment.yml";
        }

        // Set variables
        variables.forEach((variable, key)=>{
            env[key] = variable.value;
        });

        fs.writeFileSync(envFileName,yaml.stringify(env));
    }

    public static readConfigFrom(path:string, variableName:string, write:boolean = true):string{
        let envFileName = "";
        let env:any;
        let projectName:string = ProjectManager.getInstance().getProjectNameByPath(path);


        // decide which environment variable context should be loaded
        if (projectName === "all"){
            envFileName = this.xclHome + "/environment.yml";
        }else{
            // BUG: getProject legt unter Umständen ein neues an. Das DARF nicht sein, da diese Methode
            //        von den Commands direkt aufgerufen wird
            if (write) {
                let project:Project    = ProjectManager.getInstance().getProject(projectName);
                envFileName = project.getPath()+"/.xcl/env.yml";
            } else {
                envFileName = process.cwd() + "/.xcl/env.yml";
            }
        }

        if(write && !fs.existsSync(envFileName)){
            this.initialize(projectName);
        }

        if (projectName !== "all" && variableName === "project"){
            return projectName;
        }else{
            // Load
            try{
                env = yaml.parse(fs.readFileSync(envFileName).toString());
                return env[variableName];
            }catch(err){
                if(!fs.pathExistsSync(envFileName)){
                    Environment.initialize('all');
                }
                return "";
            }
        }
    }

    public static setVarsFromWizard(config:ProjectWizardConfiguration, project:Project):Map<string,{value:string, required:boolean}> {
      const localEnv = Environment.initialize(config.project, project);

      //variable 'schema' is not to be set by end-user
      Environment.setVariable("connection", config.connection, localEnv);
      Environment.setVariable("project",    config.project,    localEnv);
      Environment.setVariable("password",   config.password,   localEnv);
      Environment.setVariable("syspw",      config.adminpass,  localEnv);
      
      Environment.writeEnvironment(config.project, localEnv);

      return localEnv;
    }

}