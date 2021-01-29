import * as fs from "fs-extra";
import  * as os from 'os';
import * as yaml from "yaml";
import { ProjectManager } from './ProjectManager';
import chalk from 'chalk'
export class Environment{
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";

    public static initialize(projectName:string):Map<string,string>{
        let variables:Map<string,string>=new Map<string, string>();
        let envFileName="";
        let env:any={};
        
        // Available environment variable declaration 
        // List can be extended
        variables=new Map<string, string>();
        variables.set('connection','');
        variables.set('project','');
        variables.set('syspw','');
        variables.set('password','');
        variables.set('ords','');
        
        // Decide which environment variables context should be loaded 
        if(projectName.toLocaleLowerCase()!=="all"){
            // environment variable of project
            envFileName = this.xclHome+"/environment_"+projectName+".yml";
        }else{
            // globals
            envFileName = this.xclHome+"/environment.yml";
        }

        // Check if environment variable file exists if not, write skelleton to file
        if(!fs.existsSync(envFileName)){
            variables.forEach((value, key)=>{
                env[key]=value;
            });
            fs.writeFileSync(envFileName,yaml.stringify(env)); 
        }else{
            // load environment variables from file if exists
            env=yaml.parse(fs.readFileSync(envFileName).toString());
            variables.forEach((value, key)=>{
                variables.set(key, env[key]);
            });
        }

        return variables;
    }

    public static writeEnvironment(projectName:string, variables:Map<string,string>){
        let envFileName="";
        let env:any={};

        // Decide which environment variables context should be written
        if (projectName.toLocaleLowerCase()!=="all"){
            envFileName = this.xclHome+"/environment_" + projectName + ".yml";
        }else{ 
            envFileName = this.xclHome+"/environment.yml";
        }
       
        // Set variables
        variables.forEach((value, key)=>{
            env[key]=value;
        });

        fs.writeFileSync(envFileName,yaml.stringify(env));
    }

    public static readConfigFrom(path:string, variableName:string):string{
        let envFileName = "";
        let env:any;
        let projectName:string=ProjectManager.getInstance().getProjectNameByPath(path);
        // Decide which environment variables context should be loaded 
        if (projectName==="all"){
            envFileName = this.xclHome+"/environment.yml";
        }else{
            envFileName = this.xclHome+"/environment_" + projectName + ".yml";
        }

        if(!fs.existsSync(envFileName)){
            this.initialize(projectName);
        }

        if (projectName!=="all" && variableName==="project"){
            return projectName;
        }else{
            // Load 
            try{
                env=yaml.parse(fs.readFileSync(envFileName).toString());
                return env[variableName];
            }catch(err){
               throw Error(err);
            }
        }
    }
}