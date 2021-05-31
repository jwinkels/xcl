import * as os from "os";
import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as http from 'http';
import * as Oauth from 'client-oauth2';
import * as Express from 'express';
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
        accessTokenUri: 'https://github.com/login/oauth/access_token',
        authorizationUri: 'https://github.com/login/oauth/authorize',
        redirectUri: 'http://localhost:9999/auth/github/callback'
       });

       

     let app = Express();

     let redirectServer=app.get('/auth/github', function (req, res) {
        var uri = githubAuth.code.getUri();
        res.redirect( uri + '&login='+username );
        redirectServer.close();
      }).listen(9998);
     
      
      let server=app.get('/auth/github/callback', function (req, express) {
            let authToken="";
            let httpReq=http.request('http://130.61.153.127' + req.originalUrl,(res)=>{
                res.on('data', (d) => {
                    authToken += d;
                });
            
                res.on('end',()=>{
                    var credentials = GithubCredentials.readCredentials();
                    credentials.github=authToken;
                    fs.writeFileSync(GithubCredentials.xclHome + "/" + "credentials.yml", yaml.stringify(credentials));
                });
            
                }).on('error', (e) => {
                    console.error(e);
                }).on('finish',()=>{
                    express.status(200).send("Authenticated! XCL can be used now!");
                    server.close();
                });
            
                httpReq.on('error', (e) => {
                    console.error(e);
                });
                
                httpReq.end();
      }).listen(9999);
      open('http://localhost:9998/auth/github');
    }
}