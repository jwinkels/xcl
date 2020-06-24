import { execSync,spawnSync } from 'child_process';
import * as path from 'path'
import chalk from 'chalk'
import cli from 'cli-ux'
import { resolve } from 'dns';

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
                        resolve();
                    }else{
                        reject(childProcess.error.message);
                    }
                    

            
            }catch(err){
                reject(err);
            }
        });
    }

}