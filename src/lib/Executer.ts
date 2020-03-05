import { spawnSync } from 'child_process';

const { spawn } = require('child_process');


export class Executer{
    public static execute(connection:string, path:String){
        console.log('Installing...');
        console.log(spawnSync('sql '+connection+ ' @'+path));
    }
}