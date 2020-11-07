import { execSync,spawnSync } from 'child_process';
import * as path from 'path'
import chalk from 'chalk'
import cli from 'cli-ux'
import { resolve } from 'dns';
import { fstat, fstatSync } from 'fs';
import * as fs from "fs-extra";

export class ShellHelper{

    public static executeScript(script: string, executePath:string){
    return new Promise((resolve, reject)=>{
            try{
                const childProcess = spawnSync(
                    script, 
                    [], {
                        encoding: 'utf8',
                        cwd: executePath,
                        shell: true
                    }
                    );
                    
                    if(!childProcess.error){
                        console.log(chalk.gray(childProcess.stdout)); 
                        if(childProcess.stderr.toLocaleLowerCase().includes('failed')){
                            console.log(chalk.redBright(childProcess.stderr));
                        }else{
                            console.log(chalk.yellow(childProcess.stderr));
                        }
                        
                        if (script.includes('plan.sh')){
                            fs.appendFileSync(executePath+'/apply.log', 'apply '+Date.now().toLocaleString());
                            fs.appendFileSync(executePath+'/apply.log', childProcess.stdout);
                            resolve();
                        }
                    }else{
                        reject(childProcess.error.message);
                    }
                    

            
            }catch(err){
                reject(err);
            }
        });
    }

}