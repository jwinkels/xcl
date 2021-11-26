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
                const childProcess = spawn(
                    script, 
                    [], {
                        cwd: executePath,
                        shell: true,
                        env: envObject,
                        stdio: ['inherit', null, null] 
                    }
                );

                childProcess.stdout.on('data',function(data){
                    if (consoleOutput){
                        if(data.toString().trim()!==""){
                            logger.getLogger().log("info", data.toString().trim());
                        }
                    }else{
                        retObj.result = retObj.result ? retObj.result : "" + data.toString().trim();
                    }
                });

                childProcess.stderr.on('data',function(data){
                    if(data.toString().trim()!==""){
                        retObj.status=false;
                        retObj.result="";
                        logger.getLogger().log("info", data.toString().trim());
                    }
                });

                childProcess.on('close',function(code){
                    retObj.status = true;
                    resolve(retObj);
                });
        
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