import {spawnSync, spawn } from 'child_process';
import chalk from 'chalk'
import * as fs from "fs-extra";
import { boolean } from '@oclif/parser/lib/flags';
import { Logger } from './Logger';

export class ShellHelper{
    
    public static executeScriptWithEnv(script: string, executePath:string, envObject:any, consoleOutput:boolean=false, logger:Logger):Promise<{status: boolean, result: string}>{
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
                    if (childProcess.stdout){
                        retObj.result = childProcess.stdout;
                        logger.getLogger().info(childProcess.stdout.trim());
                    }
                    retObj.status = true;
                    resolve(retObj);

                }else{
                    logger.getLogger().error(childProcess.stderr);
                    retObj.status=false;
                    retObj.result="";
                    resolve(retObj);
                }
            
        
            }catch(err){
                console.log(executePath);
                logger.getLogger().error(err);
                retObj.status=false;
                retObj.result="";
                resolve(retObj);
            }
        });
    }

    public static executeScript(script: string, executePath:string, consoleOutput:boolean=false, logger:Logger){
        return ShellHelper.executeScriptWithEnv(script, executePath, {}, consoleOutput, logger);
    }
}