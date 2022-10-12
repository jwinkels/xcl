import { ShellHelper } from "./ShellHelper";
import { Logger } from "./Logger";
import chalk from 'chalk'
import { Utils } from "./Utils";
import { ProjectManager } from "./ProjectManager";
import { Project } from "./Project";
import * as fs from "fs-extra";
export class Git{

   public static async isGitRepository():Promise<boolean>{
      return fs.existsSync(process.cwd() + '/.git');
   }

   //is tag or commit part of this repo
   public static async isValidCommit(commit:string):Promise<string>{
      if(await this.isGitRepository()){
         let output = await ShellHelper.executeScript(`git rev-list -n 1 ${commit}`,process.cwd(), false, new Logger(process.cwd()));
         if (output.result.includes('fatal')){
            return '';
         }else{
            return output.result;
         }
      }else{
         return '';
      }
   }


   //get local current commit id
   public static async getCurrentCommitId():Promise<string>{
      if(await this.isGitRepository()){
         return (await ShellHelper.executeScript('git rev-parse HEAD', process.cwd(), false , new Logger(process.cwd()))).result;
      }else{
         return '';
      }
   }

   //get latest commit that is marked with a tag
   public static async getLatestTaggedCommitId():Promise<string>{
      if(await this.isGitRepository()){
         return (await ShellHelper.executeScript('git rev-list --tags --max-count=1', process.cwd(), false , new Logger(process.cwd()))).result;
      }else{
         return '';
      }
   }

   //get name of the newest tag
   public static async getLatestTagName():Promise<string>{
      if(await this.isGitRepository()){
         let commitId:string = await this.getLatestTaggedCommitId();
         return commitId ? (await ShellHelper.executeScript(`git describe --tags ${(await this.getLatestTaggedCommitId())}`, process.cwd(), false, new Logger(process.cwd()))).result : "";
      }else{
         return '';
      }
   }

   //get commit id of the a tag
   public static async getCommitIdOfTag(tag:string):Promise<string>{
      if(await this.isGitRepository()){
         return (await ShellHelper.executeScript(`git rev-list -n 1 ${tag}`,process.cwd(), false , new Logger(process.cwd()))).result;
      }else{
         return '';
      }
   }

   //get the commit id of the last (n-1) tag 
   public static async getPreviousTaggedCommitId():Promise<string>{
      if(await this.isGitRepository()){
         return (await ShellHelper.executeScript(`git rev-list --tags --no-walk --skip 1 --max-count=1`, process.cwd(), false , new Logger(process.cwd()))).result;
      }else{
         return '';
      }
   }

   //get the name of the last (n-1) tag 
   public static async getPreviousTagName():Promise<string>{
      if(await this.isGitRepository()){
         return (await ShellHelper.executeScript(`git describe --tags ${(await this.getPreviousTaggedCommitId())}`, process.cwd(), false, new Logger(process.cwd()))).result;
      }else{
         return '';
      }
   }

   public static async getTagList():Promise<string[]>{
      try{
         if(await this.isGitRepository()){
            return (await ShellHelper.executeScript(`git tag -l`, process.cwd(), false, new Logger(process.cwd()))).result.split("\n");
         }else{
            return ['latest'];
         }
      }catch(error){
         return ["latest"];
      }
   }

   public static async getPreviousCommitId():Promise<string>{
      if(await this.isGitRepository()){
         return (await ShellHelper.executeScript(`git rev-list --max-count=1 HEAD~1`, process.cwd(), false , new Logger(process.cwd()))).result;
      }else{
         return '';
      }
   }

   public static async getChangedFiles(mode:string, commit:string|undefined, projectName:string):Promise<string[]>{

      const endings:string = `*.sql *.pks *.pkb *.zip`;
      const exclude:string = `:!apex :!db/${projectName}_app/build :!db/${projectName}_data/build :!db/${projectName}_logic/build`;

      const excludeInit:string = `:!db/${projectName}_app/dml/patch :!db/${projectName}_app/ddl/patch`;
      const excludePatch:string = `:!db/${projectName}_app/dml/init :!db/${projectName}_app/ddl/init`;

      let modifiers:string = `${endings} ${exclude}`;
      let project:Project = ProjectManager.getInstance().getProject(projectName);

      if(mode == 'patch'){
         modifiers = modifiers + ` ${excludePatch}`;
      }else if(mode == 'init'){
         modifiers = modifiers + ` ${excludeInit}`;
      }

      let fileList:string  =  "";
      let command:string   =  "";
      if(await this.isGitRepository()){
         if (mode == 'patch'){
            const commitA:string = commit == 'latest' ? await this.getCurrentCommitId() : await this.getCommitIdOfTag(commit!);
            const commitB:string = project.getStatus().getCommitId();
            if(!commitB){
               console.log(chalk.yellow('WARNING: Building a patch without necessary commitId. The resulting build will be empty!'));
               console.log(chalk.blueBright('HINT: Use "xcl project reset" to set the commitId manually'));
            }else{
               command              = `git diff --name-only --diff-filter=ACMRTUBX ${commitB} ${commitA} -- ${modifiers}`;
            }
         }else if(mode == 'init'){
            command              = `git ls-files --cached -- ${modifiers}`;
         }

         fileList = ( await ShellHelper.executeScript(command,
                     process.cwd(),
                     false,
                     new Logger(process.cwd())
                     )).result;

         if (fileList){
            return fileList.split('\n');
         }else{
            return [];
         }
      }else{
         return [];
      }
   }

   public static async getChangedTables(projectName:string, tablesPath:string, commit:string|undefined):Promise<string[]>{
      const endings:string   = `*.sql`;
      let modifiers:string   = `${endings}`
      let project:Project    = ProjectManager.getInstance().getProject(projectName);
      let fileList:string    = "";
      const newTablesCommand = `git ls-files -o -- ${tablesPath}`;
      if(await this.isGitRepository()){
         if (commit){
            const commitA:string = commit == 'latest' ? await this.getCurrentCommitId() : await this.getCommitIdOfTag(commit!);
            const commitB:string = project.getStatus().getCommitId();
            const gitCommand = `git diff --name-only --diff-filter=ACMRTUBX ${commitB} ${commitA} -- ${tablesPath}`;
            fileList=(await ShellHelper.executeScript(gitCommand,
                                                      process.cwd(),
                                                      false,
                                                      new Logger(process.cwd())
                                                      )).result;
         }else{                                             
            const gitCommand = `git diff --name-only --diff-filter=ACMRTUBX -- ${tablesPath}${modifiers}`;
            fileList=(await ShellHelper.executeScript(gitCommand,
               process.cwd(),
               false,
               new Logger(process.cwd())
            )).result;   
         }                             
         
         let newTables = (await ShellHelper.executeScript(newTablesCommand,
                           process.cwd(),
                           false,
                           new Logger(process.cwd())
                        )).result;                          
         
         //Just changes but no new tables
         if (fileList && !newTables){
            return fileList.split('\n');
         }
         //just new tables
         else if(!fileList && newTables){
            return newTables.split('\n');
         }
         //changed and new tables
         else if(fileList && newTables){
            return fileList.split('\n').concat(newTables.split('\n'));
         }
         //no tables at all
         else{
            return [];
         }
      }else{
         return [];
      }
   }

   public static async getChangedApexApplications(projectName:string, commit:string|undefined, mode:string):Promise<string[]>{
      let project:Project    = ProjectManager.getInstance().getProject(projectName);
      let commandReturn:string  =  "";
      let regexp:RegExp =  /f\d{3,4}/gm;
      let appMap = new Map<string,string>();
      let appList:string[] = [];
      let fileList:string[] = [];
      if(await this.isGitRepository()){
         if(mode === 'patch'){
            if (commit){
               const commitA:string = commit == 'latest' ? await this.getCurrentCommitId() : await this.getCommitIdOfTag(commit!);
               const commitB:string = project.getStatus().getCommitId();
               const command =`git diff --name-only --diff-filter=ACMRTUBX ${commitB} ${commitA} -- apex`;
      
               commandReturn = ( await ShellHelper.executeScript(command,
                  process.cwd(),
                  false,
                  new Logger(process.cwd())
               )).result;         
            }else{
               return [];
            }
         }else{
            const command  = `git ls-files --cached -- apex`;
            commandReturn = ( await ShellHelper.executeScript(command,
               process.cwd(),
               false,
               new Logger(process.cwd())
            )).result;
         }

         if (commandReturn){
            fileList = commandReturn.split('\n');
            for (const i in fileList){
               if(regexp.test(fileList[i])){  
                  let appNumbers = fileList[i].match(regexp);
                  if(appNumbers){
                     for(let j=0; j<appNumbers.length; j++){
                        appMap.set(appNumbers[j], appNumbers[j]);
                     }
                  }
               }
            }

            for(const app of appMap.values()){
               appList.push(app);
            }
            
            return appList;
         }else{
            return [];
         }
      }else{
         return [];
      }
   }

   public static async addToGitignore(projectPath:string, filePath:string){
      const gitignore:string = projectPath + '/.gitignore';

      Utils.addLine(gitignore, filePath);
   }

   public static async checkoutDefaultBranch(defaultBranch:string|undefined=undefined):Promise<string>{
      if (defaultBranch){
         const command = `git checkout ${defaultBranch}`;
         await ShellHelper.executeScript(command, process.cwd(), false, new Logger(process.cwd()));
         return defaultBranch;
      }else{
         const commandA = `git checkout main`;
         let branch = await ShellHelper.executeScript(commandA, process.cwd(), false, new Logger(process.cwd()));
         if (branch.status){
            return 'main';
         }else{
            const commandB  = `git checkout master`;
            branch = await ShellHelper.executeScript(commandB, process.cwd(), false, new Logger(process.cwd()));
            if(branch.status){
               return 'master';
            }else{
               console.log('Coud not detect default branch! Please set it manually using xcl config defaults');
               return "";
            }
            
         }
      }
   }
}