import { injectable } from "inversify";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from "./ProjectFeature";

@injectable()
export class Liquibase implements DeliveryMethod{
   install(feature: ProjectFeature, projectPath: string, singleSchema: boolean): void {
      throw new Error("Method not implemented.");
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
