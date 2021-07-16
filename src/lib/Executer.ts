import { spawnSync } from 'child_process';

export class Executer{
    public static execute(connection:string, path:string){
        console.log('Installing...');
        console.log(process.cwd());
        var result=spawnSync('sql',[connection] ,{encoding: 'utf8',input:'@'+path, shell:true});
        console.log(result.stdout.toString());
        console.log(result.stderr.toString());
        return result.status;
    }
}