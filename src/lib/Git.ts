import { ShellHelper } from "./ShellHelper";
import { Logger } from "./Logger";
import * as fs from "fs-extra";
import { Utils } from "./Utils";
import { ProjectManager } from "./ProjectManager";
import { Project } from "./Project";
export class Git{

   //is tag or commit part of this repo
   public static async isValidCommit(commit:string):Promise<string>{
      let output = await ShellHelper.executeScript(`git rev-list -n 1 ${commit}`,process.cwd(), false, new Logger(process.cwd()));
      if (output.result.includes('fatal')){
         return '';
      }else{
         return output.result;
      }
   }


   //get local current commit id
   public static async getCurrentCommitId():Promise<string>{
     return (await ShellHelper.executeScript('git rev-parse HEAD', process.cwd(), false , new Logger(process.cwd()))).result;
   }

   //get latest commit that is marked with a tag
   public static async getLatestTaggedCommitId():Promise<string>{
      return (await ShellHelper.executeScript('git rev-list --tags --max-count=1', process.cwd(), false , new Logger(process.cwd()))).result;
   }

   //get name of the newest tag
   public static async getLatestTagName():Promise<string>{
      let commitId:string = await this.getLatestTaggedCommitId();
      return commitId ? (await ShellHelper.executeScript(`git describe --tags ${(await this.getLatestTaggedCommitId())}`, process.cwd(), false, new Logger(process.cwd()))).result : "";
   }

   //get commit id of the a tag
   public static async getCommitIdOfTag(tag:string):Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list -n 1 ${tag}`,process.cwd(), false , new Logger(process.cwd()))).result;
   }

   //get the commit id of the last (n-1) tag 
   public static async getPreviousTaggedCommitId():Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list --tags --no-walk --skip 1 --max-count=1`, process.cwd(), false , new Logger(process.cwd()))).result;
   }

   //get the name of the last (n-1) tag 
   public static async getPreviousTagName():Promise<string>{
      return (await ShellHelper.executeScript(`git describe --tags ${(await this.getPreviousTaggedCommitId())}`, process.cwd(), false, new Logger(process.cwd()))).result;
   }

   public static async getTagList():Promise<string[]>{
      try{
         return (await ShellHelper.executeScript(`git tag -l`, process.cwd(), false, new Logger(process.cwd()))).result.split("\n");
      }catch(error){
         return ["latest"];
      }
   }

   public static async getPreviousCommitId():Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list --max-count=1 HEAD~1`, process.cwd(), false , new Logger(process.cwd()))).result;
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
      
      if (mode == 'patch'){
         const commitA:string = commit == 'latest' ? await this.getCurrentCommitId() : await this.getCommitIdOfTag(commit!);
         const commitB:string = project.getStatus().getCommitId();
         command              = `git diff --name-only --diff-filter=ACMRTUBX ${commitB} ${commitA} -- ${modifiers}`;
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
         return [""];
      }
   }

   public static async getChangedTables(projectName:string, tablesPath:string, commit:string|undefined):Promise<string[]>{
      const endings:string   = `*.sql`;
      let modifiers:string   = `${endings}`
      let project:Project    = ProjectManager.getInstance().getProject(projectName);
      let fileList:string    = "";
      const newTablesCommand = `git ls-files -o -- ${tablesPath}`;
      
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
         return [""];
      }
   }

   public static async addToGitignore(projectPath:string, filePath:string){
      const gitignore:string = projectPath + '/.gitignore';

      Utils.addLine(gitignore, filePath);
   }
}