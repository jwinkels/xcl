import * as fs from "fs-extra";
import * as https from "https";

export class Feature{

    private name:String;
    private owner:String;
    private repo:String;
    private isManagedByTag:boolean=false;
    private isManagedByRelease:boolean=false;

    constructor(name:String, owner:String, repo:String, managedBy:String){
        this.name=name;
        this.owner=owner;
        this.repo=repo;

        if (managedBy=='tag'){
            this.isManagedByTag=true;
        }else{
            if (managedBy=='release'){
                this.isManagedByRelease=true;
            }else{
                throw Error('Unknown Option:"'+managedBy+'"!\n A Feature must be called by "tag" or by "release"!');
            }
        }
    }

    public getReleases():Promise<String[]>{
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
            headers: {'User-Agent':'xline'}
        };

        //ClientRequest request=https.request();
    }

    public getName():String{
        return this.name;
    }

    public getRepo():String{
        return this.repo;
    }

    public getOwner():String{
        return this.owner;
    }

    private call():Promise<any>{
        return new Promise<any>((resolve,reject)=>{
            let path:string='/repos/'+this.owner+'/'+this.repo;
            let data ="";

            if(this.isManagedByRelease){
                path+='/releases';
            }else{
                if(this.isManagedByTag){
                    path+='/tags';
                }
            }
            
            const options:https.RequestOptions = {
                host: 'api.github.com',
                port: 443,
                path: path,
                headers: {'User-Agent':'xcl'}
              };
            
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