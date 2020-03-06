import * as fs from "fs-extra";
import * as https from "https";
import {GithubCredentials} from './GithubCredentials';

export class Feature{

    private name:string;
    private owner:String;
    private repo:String;
    private gitAttribute:String;
    private isManagedByTag:boolean=false;
    private isManagedByRelease:boolean=false;
    

    constructor(args: {name:string, owner:String, repo:String, gitAttribute:String }){
        this.name=args.name;
        this.owner=args.owner;
        this.repo=args.repo;
        this.gitAttribute=args.gitAttribute;
        
        if (args.gitAttribute == 'tag'){
            this.isManagedByTag = true;
          
        }else{
            if (args.gitAttribute == 'release'){
                this.isManagedByRelease = true;
            }else{
                throw Error('Unknown Option:"' + args.gitAttribute + '"!\n A Feature must be called by "tag" or by "release"!');
            }
        }
    }

    public getReleaseInformation():any{
        return new Promise<String[]>((resolve, reject)=>{
            let releases:String[]=[];
            this.call().then(function(featureData){
                let featureJSON = JSON.parse(featureData);
                try{
                    for(let i=0; i<featureJSON.length; i++){
                        if(featureJSON[i].tag_name){
                            releases.push(featureJSON[i].tag_name);
                        }else if(featureJSON[i].name){
                            releases.push(featureJSON[i].name);
                        }
                    }
                }catch(err){
                   reject(err); 
                }
                resolve(releases);
            })
        });
    }

    public downloadFeature(){
        const options={ 
            host: 'api.github.com',
            port: 443,
            path: '/repos/'+this.owner+'/'+this.repo+'/releases',
            headers: {'User-Agent':'xcl'}
        };

        //ClientRequest request=https.request();
    }

    public getName():string{
        return this.name;
    }

    public getRepo():String{
        return this.repo;
    }

    public getOwner():String{
        return this.owner;
    }

    public getGitAttribute():String{
        return this.gitAttribute;
    }

    protected call():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            let path:string='/repos/'+this.owner+'/'+this.repo;
            let data ="";
            var options:https.RequestOptions;
            
            if(this.isManagedByRelease){
                path+='/releases';
            }else{
                if(this.isManagedByTag){
                    path+='/tags';
                }
            }
        
            if(GithubCredentials.get()){
                console.log('using credentials');
                options = {
                    host: 'api.github.com',
                    port: 443,
                    path: path,
                    headers: {
                        'User-Agent':'xcl',
                        'Authorization': 'Basic '+GithubCredentials.get()
                    }
                };
            }else{
                console.log('no credentials');
                options = {
                    host: 'api.github.com',
                    port: 443,
                    path: path,
                    headers: {
                        'User-Agent':'xcl'
                    }
                };
            }
            
            const req=https.request(options,(res)=>{
            res.on('data', (d) => {
                data+=d;
            });
        
            res.on('end',()=>{
                resolve(data);
            });
        
            }).on('error', (e) => {
             console.error(e);
            });
        
            req.on('error', (e) => {
                console.error(e);
            });
            req.end();

        });
    }
}