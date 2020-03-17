import { Feature } from './Feature';
import chalk from 'chalk'
import { Schema } from './Schema';


export class ProjectFeature extends Feature{
    private version:String;
    private installed:Boolean;
    private user:Schema;

    constructor(args : {parent:Feature, version:String, username:string, password:string, installed:Boolean}){
            super( {
                name : args.parent.getName(), 
                owner : args.parent.getOwner(), 
                repo : args.parent.getRepo(), 
                gitAttribute : args.parent.getGitAttribute(),
                type : args.parent.getType()
            });
            this.version=args.version;
            this.installed=args.installed;
            this.user=new Schema({name: args.username, password: args.password});
    }

    public getReleaseInformation():String{
        return this.version;
    }

    public setReleaseInformation(version:String){
        this.version=version;
    }

    public getStatus():string{
        if (this.installed){
            return chalk.green('installed');
        }else{
            return chalk.red('uninstalled');
        }
    }

    public getInstalled():Boolean{
        return this.installed;
    }

    public setInstalled(status:Boolean){
        this.installed=status;
    }

    public getUser():Schema{
        return this.user;
    }

    public getDownloadUrl():Promise<string>{
        var self=this;
        return new Promise((resolve, reject)=>{
            this.call()
                .then(function(releases){
                    var jsonObject = JSON.parse(releases.toString());
                    try{
                        for (var i=0; i<jsonObject.length; i++){
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