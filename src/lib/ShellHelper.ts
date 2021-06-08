import {spawnSync } from 'child_process';
import chalk from 'chalk'
import * as fs from "fs-extra";
import { boolean } from '@oclif/parser/lib/flags';

export class ShellHelper{
    
    public static executeScriptWithEnv(script: string, executePath:string, envObject:any, consoleOutput:boolean=false):Promise<{status: boolean, result: string}>{
    return new Promise((resolve, reject)=>{
            let retObj:any = {}
            try{    
                const childProcess = spawnSync(
                    script, 
                    [], {
                        encoding: 'utf8',
                        cwd: executePath,
                        shell: true,
                        env: envObject,
                        stdio:[process.stdin, consoleOutput ? process.stdout : null, process.stderr]
                    }
                );
                if(!childProcess.error){
 
                    fs.appendFileSync(executePath+'/xcl.log','\n\r'+ new Date().toLocaleString() + ': ' + process.stdout); 
                        
                    if (childProcess.stdout){
                        retObj.result = childProcess.stdout;
                    }
                    retObj.status = true;
                    resolve(retObj);

                }else{
                    fs.appendFileSync(executePath+'/xcl.log','\n\r'+ new Date().toLocaleString() + ': ' + childProcess.stderr); 
                    retObj.status=false;
                    retObj.result="";
                    resolve(retObj);
                }
                    

            
            }catch(err){
                console.log(executePath);
                fs.appendFileSync(executePath+'/xcl.log','\n\r'+ new Date().toLocaleString() + ': ' + err);
                retObj.status=false;
                retObj.result="";
                resolve(retObj);
            }
        });
    }

    public static executeScript(script: string, executePath:string, consoleOutput:boolean=false){
        return ShellHelper.executeScriptWithEnv(script, executePath, {}, consoleOutput);
    }
}