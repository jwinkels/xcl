import { string } from "@oclif/core/lib/flags";
import * as https from "https";
import {GithubCredentials} from './GithubCredentials';

export class Feature{

    private name:string;
    private owner:string;
    private repo:string;
    private gitAttribute:string;
    private isManagedByTag:boolean=false;
    private isManagedByRelease:boolean=false;
    private type:string;
    private minPublishDate:Date;
    private creates:string[];

    constructor(args: {name:string, owner:string, repo:string, gitAttribute:string, type:string, minPublishDate:Date, creates:string[]}){
        this.name           = args.name;
        this.owner          = args.owner;
        this.repo           = args.repo;
        this.gitAttribute   = args.gitAttribute;
        this.type           = args.type;
        this.minPublishDate = args.minPublishDate;
        this.creates        = args.creates;
        
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
        let _this = this;
        return new Promise<string[]>((resolve, reject)=>{
            let releases:string[]=[];
            this.call().then(function(featureData){
                let featureJSON = JSON.parse(featureData);
                try{
                    for(let i=0; i<featureJSON.length; i++){
                        let releaseDate:Date = new Date(featureJSON[i].published_at ? featureJSON[i].published_at : new Date());
                        if(featureJSON[i].tag_name && ( releaseDate > _this.getMinPublishDate())){
                            releases.push(featureJSON[i].tag_name);
                        }else if(featureJSON[i].name && (releaseDate > _this.getMinPublishDate())){
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

    public getType():string{
        return this.type;
    }

    public getMinPublishDate():Date{
        return this.minPublishDate ? this.minPublishDate : new Date("01.01.1999");
    }

    public getCreates():string[]{
        return this.creates ? this.creates : [];
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