import * as os from "os";
import * as yaml from "yaml";
import * as fs from "fs-extra";

export class GithubCredentials{
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";

    static writeCredentials(authString:string){
        var credentials = GithubCredentials.readCredentials();
        credentials.github=authString;
        console.log(credentials);
        fs.writeFileSync(GithubCredentials.xclHome + "/" + "credentials.yml", yaml.stringify(credentials));     
    }

    private static readCredentials():any{
        try{
            if(fs.existsSync(GithubCredentials.xclHome+'/credentials.yml')){
                return yaml.parse(fs.readFileSync(GithubCredentials.xclHome+'/credentials.yml').toString());    
            }else{
                return {};
            }
        }catch(err){
            return {};
        }
    }

    static get():string{
        return GithubCredentials.readCredentials().github;
    }
}