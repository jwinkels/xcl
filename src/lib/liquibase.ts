import { injectable } from "inversify";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from "./ProjectFeature";
import { ProjectManager } from "./ProjectManager";
import * as fs from "fs-extra";

@injectable()
export class Liquibase implements DeliveryMethod{
   install(feature: ProjectFeature, projectPath: string, singleSchema: boolean): void {
      let projectName:string = ProjectManager.getInstance().getProjectNameByPath(projectPath);
      let featurePath:string = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();

      if (!singleSchema){
         fs.copyFileSync(featurePath + '/init.xml', projectPath + '/db/' + projectName + '_app/init.xml');
         fs.copyFileSync(featurePath + '/init.xml', projectPath + '/db/' + projectName + '_logic/init.xml');
         fs.copyFileSync(featurePath + '/init.xml', projectPath + '/db/' + projectName + '_data/init.xml');

         fs.copyFileSync(featurePath + '/patch.xml', projectPath + '/db/' + projectName + '_app/patch.xml');
         fs.copyFileSync(featurePath + '/patch.xml', projectPath + '/db/' + projectName + '_logic/patch.xml');
         fs.copyFileSync(featurePath + '/patch.xml', projectPath + '/db/' + projectName + '_data/patch.xml');
      }else{
         fs.copyFileSync(featurePath + '/init.xml',  projectPath + '/db/' + projectName + '/init.xml');
         fs.copyFileSync(featurePath + '/patch.xml', projectPath + '/db/' + projectName + '/patch.xml');
      }

      feature.setInstalled(true);
   }
   build(projectName: string, version: string, mode: string, commit: string | undefined): void {
      throw new Error("Method not implemented.");
   }
   deploy(projectName: string, connection: string, password: string, schemaOnly: boolean, ords: string, silentMode: boolean, version: string, mode: string, schema: string | undefined, nocompile: boolean | undefined): Promise<{ success: boolean; mode: string; }> {
      throw new Error("Method not implemented.");
   }
   remove(feature: ProjectFeature, projectPath: string, singleSchema: boolean): void {
      throw new Error("Method not implemented.");
   }

}
