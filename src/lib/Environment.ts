import * as fs from "fs-extra";
import  * as os from 'os';
import * as yaml from "yaml";
import { Project } from "./Project";
import { ProjectManager } from './ProjectManager';
export class Environment{
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";

    public static initialize(projectName:string, schema:string = '', project:Project|undefined=undefined):Map<string,{value:string, required:boolean}>{

        let envFileName="";
        let env:any={};
        let variables:Map<string,{value:string, required:boolean}> = Environment.getVariablesMap(projectName, schema);
        let globals = "environment.yml";
        let projectVariables  = "env.yml";
        // Decide which environment variables context should be loaded
        if(projectName.toLocaleLowerCase() !== "all" && project){
            // environment variable of project
            envFileName = project.getPath() + "/.xcl/" + projectVariables;
        }else{
            // globals
            envFileName = this.xclHome + "/environment.yml";
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
        let env:any={};
        env=yaml.parse(fs.readFileSync(envFileName).toString());
        variables.forEach((variable: {value:string, required:boolean}, key)=>{
            this.setVariable(key, env[key], variables);
        });

        return variables;
    }

    private static getVariablesMap(projectName:string, schema:string = ''):Map<string,{value:string, required:boolean}>{
        // Available environment variable declaration
        // List can be extended
        let variables:Map<string,{value:string, required:boolean}>=new Map<string, {value:string, required:boolean}>();
        variables=new Map<string, {value:string, required:boolean}>();
        variables.set('connection', {value: "unset", required: true});
        variables.set('project', {value: projectName !== "all" ? projectName : "", required: true});
        variables.set('syspw', {value:"", required: false});
        variables.set('password',{value:'', required: false});
        variables.set('ords',{value:"", required: false});
        variables.set('schema', {value: schema, required: false});
        return variables;
    }

    public static setVariable(variableName:string, value:string, variables:Map<string,{value:string, required:boolean}>):Map<string,{value:string, required:boolean}>{
        let variable:{value:string, required:boolean} = variables.get(variableName)!;
        variable.value = value;
        variables.set(variableName, variable);
        return variables;
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

    public static readConfigFrom(path:string, variableName:string):string{
        let envFileName = "";
        let env:any;
        let projectName:string = ProjectManager.getInstance().getProjectNameByPath(path);
        // Decide which environment variables context should be loaded
        if (projectName === "all"){
            envFileName = this.xclHome + "/environment.yml";
        }else{
            let project:Project    = ProjectManager.getInstance().getProject(projectName);
            envFileName = project.getPath()+"/.xcl/env.yml";
        }

        if(!fs.existsSync(envFileName)){
            this.initialize(projectName);
        }

        if (projectName !== "all" && variableName === "project"){
            return projectName;
        }else{
            // Load
            try{
                env = yaml.parse(fs.readFileSync(envFileName).toString());
                return env[variableName];
            }catch(err:any){
               throw Error(err);
            }
        }
    }
}