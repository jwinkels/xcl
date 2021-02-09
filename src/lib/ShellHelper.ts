import { execSync,spawnSync } from 'child_process';
import chalk from 'chalk'
import * as fs from "fs-extra";

export class ShellHelper{

    public static executeScriptWithEnv(script: string, executePath:string, envObject:any){
    return new Promise((resolve, reject)=>{
            try{
                const childProcess = spawnSync(
                    script, 
                    [], {
                        encoding: 'utf8',
                        cwd: executePath,
                        shell: true,
                        env: envObject
                    }
                    );
                    
                    if(!childProcess.error){
                        console.log(chalk.gray(childProcess.stdout)); 
                        //fs.appendFileSync(executePath+'/xcl.log', childProcess.stderr); 
                        if(childProcess.stderr.toLocaleLowerCase().includes('failed')){
                            console.log(chalk.redBright(childProcess.stderr));
                          //  fs.appendFileSync(executePath+'/xcl.log','FAILURE: '+ childProcess.stderr); 
                        }else{
                            console.log(chalk.yellow(childProcess.stderr));
                            //fs.appendFileSync(executePath+'/xcl.log', childProcess.stderr); 
                        }
                        
                        if (script.includes('plan.sh')){
                            fs.appendFileSync(executePath+'/xcl.log', 'APPLY STARTED: '+new Date().toLocaleString()); 
                        }
                        resolve(childProcess.stdout);
                    }else{
                        reject(childProcess.error.message);
                    }
                    

            
            }catch(err){
                reject(err);
            }
        });
    }

    public static executeScript(script: string, executePath:string){
        return ShellHelper.executeScriptWithEnv(script, executePath, {})
    }
}