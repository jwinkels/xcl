import * as os from "os";
import * as yaml from "yaml";
import * as fs from "fs-extra";
import { Server } from 'http';
import * as Oauth from 'client-oauth2';
import * as Express from 'express';
import { resolve } from 'dns';
import { rejects } from 'assert';
import * as open from 'open';

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

    public static async oauth(username:string){
        
       var githubAuth = new Oauth({
        clientId: '3c1dea5b9bd633b11c8b',
        clientSecret: 'a800d53588efa396ffe097eceed7a21e1dead7b0',
        accessTokenUri: 'https://github.com/login/oauth/access_token',
        authorizationUri: 'https://github.com/login/oauth/authorize',
        redirectUri: 'http://localhost:9999/auth/github/callback'
       });

       let app = Express();

       app.get('/auth/github', function (req, res) {
        var uri = githubAuth.code.getUri()
       
        res.redirect(uri+'&login='+username)
      });

     
      
      
      let server=app.get('/auth/github/callback', function (req, res) {
        githubAuth.code.getToken(req.originalUrl)
          .then(function (user) {
            // Refresh the current users access token.
            //user.refresh();
            //console.log(user.accessToken);
            var credentials = GithubCredentials.readCredentials();
            credentials.github=user.accessToken;
            fs.writeFileSync(GithubCredentials.xclHome + "/" + "credentials.yml", yaml.stringify(credentials));
            // We should store the token into a database.
            return res.send(user.accessToken)
          })
        .finally(()=>{
            server.close()
        });
      }).listen(9999);
      open(githubAuth.code.getUri());
    }
}