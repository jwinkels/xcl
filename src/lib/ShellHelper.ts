import { execSync,spawnSync } from 'child_process';
import * as path from 'path'
import chalk from 'chalk'
import cli from 'cli-ux'

export class ShellHelper{

    public static executeScript(script: string, executePath:string){
    
    const childProcess = spawnSync(
        script, 
        [], {
            encoding: 'utf8',
            cwd: executePath,
            shell: true
        }
        );
        
    
        console.log(chalk.gray(childProcess.stdout)); 

    }

}