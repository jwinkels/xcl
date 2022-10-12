import {spawnSync, spawn } from 'child_process';
import chalk from 'chalk'
import * as fs from "fs-extra";
import { boolean } from '@oclif/parser/lib/flags';
import { Logger } from './Logger';

export class ShellHelper{
    
    public static executeScriptWithEnv(script: string, executePath:string, envObject:any, consoleOutput:boolean=false, logger:Logger, debug:boolean=false):Promise<{status: boolean, result: string}>{
    return new Promise((resolve, reject)=>{
            let retObj:any = {}
            let errorString:string="";
            try{
                const childProcess = spawn(
                    script, 
                    [], {
                        cwd: executePath,
                        shell: true,
                        env: envObject ? envObject : process.env,
                        stdio: ['inherit', null, null] 
                    }
                );

                childProcess.stdout.on('data',function(data){
                    if(debug){
                        console.log(data.toString().trim());
                    }

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
                        errorString = errorString + data.toString().trim();
                    }
                });

                childProcess.on('close',function(code){
                    if(code == 0){
                        retObj.status = true;
                    }else{
                        retObj.status = false;
                        logger.getLogger().log("error", errorString);
                        
                    }
                    resolve(retObj);
                });
        
            }catch(err){
                logger.getLogger().error(err);
                retObj.status=false;
                retObj.result="";
                resolve(retObj);
            }
        });
    }

    public static executeScript(script: string, executePath:string, consoleOutput:boolean=false, logger:Logger):Promise<{status: boolean, result: string}>{
        return ShellHelper.executeScriptWithEnv(script, executePath, undefined, consoleOutput, logger);
    }
}