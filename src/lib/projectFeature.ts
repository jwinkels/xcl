import { Feature } from './Feature';


export class ProjectFeature extends Feature{
    private version:String;
    private downloadUrl:String="";
    private installed:Boolean=false;

    public constructor(args : {parent:Feature, version:String}){
            super( { name : args.parent.getName(), 
                owner : args.parent.getOwner(), 
                repo : args.parent.getRepo(), 
                gitAttribute : args.parent.getGitAttribute()
            });
            this.version=args.version;
            this.setDownloadUrl(this.version).then(
                (url)=>{
                    this.downloadUrl=url;
                    console.log(this.downloadUrl);
                }
            );
    }

    public getReleaseInformation():String{
        return this.version;
    }

    private setDownloadUrl(versionName:String):Promise<String>{
        return new Promise<String>((resolve, reject)=>{
            this.call().then(function (releases){
                var jsonObject = JSON.parse(releases.toString());
                try{
                    for (var i=0; i<jsonObject.length; i++){
                        if (jsonObject[i].name && jsonObject[i].name.includes(versionName)){
                            resolve(jsonObject[i].zipball_url);
                        }else if (jsonObject[i].tag_name && jsonObject[i].tag_name.includes(versionName)) {
                            resolve(jsonObject[i].zipball_url);
                        }
                    }
                }catch(err){
                    reject(err);
                }
            });
        });
    }
}