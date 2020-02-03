import { Feature } from './Feature';


export class ProjectFeature extends Feature{
    private version:String;
    private downloadUrl:String;
    private installed:Boolean=false;

    public constructor(args:{parent:Feature, version:String}){
        super( { name : args.parent.getName(), 
                 owner : args.parent.getOwner(), 
                 repo : args.parent.getRepo(), 
                 gitAttribute : args.parent.getGitAttribute()
            });

        this.version=args.version;
        this.downloadUrl=this.setDownloadUrl(this.version);
    }

    public getReleaseInformation():String{
        return this.version;
    }

    private setDownloadUrl(versionName:String):String{
        this.call().then(function (releases){
            var jsonObject = JSON.parse(releases.toString());
            try{
                for (var i=0; i<jsonObject.length; i++){
                    if (jsonObject[i].name && jsonObject[i].name.includes(versionName)){
                        return jsonObject[i].zipball_url;
                    }else if (jsonObject[i].tag_name && jsonObject[i].tag_name.includes(versionName)) {
                        return jsonObject[i].zipball_url;
                    }
                }
            }catch(err){
                console.log(err);
            }
        });
    }
}