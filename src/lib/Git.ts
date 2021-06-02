import { ShellHelper } from "./ShellHelper";

export class Git{

   public static async getCurrentCommitId():Promise<string>{
     return (await ShellHelper.executeScript('git rev-parse HEAD',process.cwd())).result;
   }

   public static async getLatestTaggedCommitId():Promise<string>{
      return (await ShellHelper.executeScript('git rev-list --tags --max-count=1', process.cwd())).result;
   }
   
   public static async getLatestTagName():Promise<string>{
      return (await ShellHelper.executeScript(`git describe --tags ${(await this.getLatestTaggedCommitId())}`, process.cwd(), true)).result;
   }

   public static async getCommitIdOfTag(tag:string):Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list -n 1 ${tag}`,process.cwd())).result;
   }

   public static async getPreviousTaggedCommitId():Promise<string>{
      return (await ShellHelper.executeScript(`git rev-list --tags --no-walk --skip 1 --max-count=1`, process.cwd())).result;
   }

   public static async getPreviousTagName():Promise<string>{
      return (await ShellHelper.executeScript(`git describe --tags ${(await this.getPreviousTaggedCommitId())}`, process.cwd(), true)).result;
   }
}