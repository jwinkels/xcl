import * as https from "https";
import {GithubCredentials} from './GithubCredentials';
import {Feature, FeatureType} from './Feature'
import { Schema } from "./Schema";

export class GithubFeature implements Feature{

    
    private owner:string;
    private repo:string;
    private gitAttribute:string;
    private isManagedByTag:boolean=false;
    private isManagedByRelease:boolean=false;
    type: FeatureType;
    name: string;

    constructor(args: {name:string, owner:string, repo:string, gitAttribute:string, type:FeatureType }){
        this.name         = args.name;
        this.owner        = args.owner;
        this.repo         = args.repo;
        this.gitAttribute = args.gitAttribute;
        this.type         = args.type;

        if (args.gitAttribute == 'tag'){
            this.isManagedByTag = true;
          
        }else if (args.gitAttribute == 'release'){
                this.isManagedByRelease = true;
        }else{
            throw Error('Unknown Option:"' + args.gitAttribute + '"!\n A Feature must be called by "tag" or by "release"!');
        }
    }

    getUser(): Schema {
        throw new Error("Method not implemented.");
    }

    getVersion(): string {
        return "";
    }

    public getReleaseInformation():any{
        return new Promise<string[]>((resolve, reject)=>{
            let releases:string[]=[];
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
            path: `/repos/${this.owner}/${this.repo}/releases`,
            headers: {'User-Agent':'xcl'}
        };

        //ClientRequest request=https.request();
    }

    public getName():string{
        return this.name;
    }

    public getRepo():string{
        return this.repo;
    }

    public getOwner():string{
        return this.owner;
    }

    public getGitAttribute():string{
        return this.gitAttribute;
    }

    public getType():FeatureType{
        return this.type;
    }

    protected call():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            let path:string = `/repos/${this.owner}/${this.repo}`;
            let data        = "";
            var options:https.RequestOptions;
            
            if(this.isManagedByRelease){
                path += '/releases';
            }else{
                if(this.isManagedByTag){
                    path += '/tags';
                }
            }
        
            if(GithubCredentials.get()){
                options = {
                    host: 'api.github.com',
                    port: 443,
                    path: path,
                    headers: {
                        'User-Agent':'xcl',
                        'Authorization': 'token ' + GithubCredentials.get()
                    }
                };
            }else{
                options = {
                    host: 'api.github.com',
                    port: 443,
                    path: path,
                    headers: {
                        'User-Agent':'xcl'
                    }
                };
            }
            
            const req = https.request(options,(res)=>{
            res.on('data', (d) => {
                data += d;
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