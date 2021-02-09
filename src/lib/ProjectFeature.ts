import { Feature } from './Feature';
import chalk from 'chalk'
import { Schema } from './Schema';

export class ProjectFeature extends Feature{
    private version:string;
    private installed:boolean;
    private user:Schema;

    constructor(args : {parent:Feature, version:string, username:string, password:string, installed:boolean}){
            super( {
                name : args.parent.getName(), 
                owner : args.parent.getOwner(), 
                repo : args.parent.getRepo(), 
                gitAttribute : args.parent.getGitAttribute(),
                type : args.parent.getType()
            });
            this.version=args.version;
            this.installed=args.installed;
            this.user=new Schema({name: args.username, password: args.password, proxy:undefined});
    }

    public getReleaseInformation():string{
        return this.version;
    }

    public setReleaseInformation(version:string):void{
        this.version=version;
    }

    public getStatus():string{
        
        if (this.installed){
            return chalk.green('installed');
        }else{
            return chalk.red('uninstalled');
        }
    }

    public isInstalled():boolean{
        return this.installed;
    }

    public setInstalled(status:boolean){
        this.installed=status;
    }

    public getUser():Schema{
        return this.user;
    }

    public getDownloadUrl():Promise<string>{
        const self = this;
        return new Promise((resolve)=>{
            this.call()
                .then(function(releases){
                    const jsonObject = JSON.parse(releases.toString());
                    try{
                        for (let i=0; i<jsonObject.length; i++){
                            if (jsonObject[i].name && jsonObject[i].name.includes(self.getReleaseInformation())){
                                resolve(jsonObject[i].zipball_url);
                            }else if (jsonObject[i].tag_name && jsonObject[i].tag_name.includes(self.getReleaseInformation())) {
                                resolve(jsonObject[i].zipball_url);
                            }
                        }
                    }catch(err){
                        throw Error (err);
                    }
                });
            });
    }

    

}