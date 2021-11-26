import { ShellHelper } from "./ShellHelper";
import { Logger } from "./Logger";
import * as fs from "fs-extra";
import { Utils } from "./Utils";
import { ProjectManager } from "./ProjectManager";
import { Project } from "./Project";
export class Git{

   public static async getCurrentCommitId():Promise<string>{
     return (await ShellHelper.executeScript('git rev-parse HEAD',process.cwd(),false , new Logger(process.cwd()))).result;
   }

   public static async getLatestTaggedCommitId():Promise<string>{
      return (await ShellHelper.executeScript('git rev-list --tags --max-count=1', process.cwd(), false , new Logger(process.cwd()))).result;
   }

   public static async getLatestTagName():Promise<string>{
      let commitId:string = await this.getLatestTaggedCommitId();
      return commitId ? (await ShellHelper.executeScript(`git describe --tags ${(await this.getLatestTaggedCommitId())}`, process.cwd(), false, new Logger(process.cwd()))).result : "";
   }

   public static async getCommitIdOfTag(tag:string):Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list -n 1 ${tag}`,process.cwd(), false , new Logger(process.cwd()))).result;
   }

   public static async getPreviousTaggedCommitId():Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list --tags --no-walk --skip 1 --max-count=1`, process.cwd(), false , new Logger(process.cwd()))).result;
   }

   public static async getPreviousTagName():Promise<string>{
      return (await ShellHelper.executeScript(`git describe --tags ${(await this.getPreviousTaggedCommitId())}`, process.cwd(), false, new Logger(process.cwd()))).result;
   }

   public static async getTagList():Promise<string[]>{
      return (await ShellHelper.executeScript(`git tag -l`, process.cwd(), false, new Logger(process.cwd()))).result.split("\n");
   }

   public static async getChangedFiles(mode:string, commit:string|undefined, projectName:string):Promise<string[]>{

      const endings:string = `*.sql *.pks *.pkb *.zip`;
      const exclude:string = `:!apps :!db/${projectName}_app/build :!db/${projectName}_data/build :!db/${projectName}_logic/build`;

      const excludeInit:string = `:!db/${projectName}_app/dml_post :!db/${projectName}_app/ddl_post :!db/${projectName}_app/ddl_pre :!db/${projectName}_app/dml_post`;
      const excludePatch:string = `:!db/${projectName}_app/dml_init :!db/${projectName}_app/ddl_init`;

      let modifiers:string = `${endings} ${exclude}`;
      let project:Project = ProjectManager.getInstance().getProject(projectName);

      if(mode == 'patch'){
         modifiers = modifiers + ` ${excludePatch}`;
      }else if(mode == 'init'){
            modifiers = modifiers + ` ${excludeInit}`;
      }

      let fileList:string="";
      const commitA:string = commit == 'latest' ? await this.getCurrentCommitId() : await this.getCommitIdOfTag(commit!);
      const commitB:string = project.getStatus().getCommitId();

      if (mode == 'patch'){
      fileList=(await ShellHelper.executeScript(`git diff --name-only --diff-filter=ACMRTUBX ${commitB} ${commitA} -- ${modifiers}`,
                                                         process.cwd(),
                                                         false,
                                                         new Logger(process.cwd())
                                                      )).result;
      console.log(`git diff --name-only --diff-filter=ACMRTUBX ${commitB} ${commitA} -- ${modifiers}`);
      }else if(mode == 'init'){
         fileList = (await ShellHelper.executeScript(`git ls-files --cached -- ${modifiers}`,
                        process.cwd(),
                        false,
                        new Logger(process.cwd())
                     )).result;
      }
      if (fileList){
         return fileList.split('\n');
      }else{
         return [""];
      }
   }

   public static async addToGitignore(projectPath:string, filePath:string){
      const gitignore:string = projectPath + '/.gitignore';

      Utils.addLine(gitignore, filePath);
   }
}