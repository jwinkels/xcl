import { Feature, FeatureType } from "./Feature";
import { Project } from "./Project";
import { Schema } from "./Schema";
import * as fs from "fs-extra";

export class CustomFeature implements Feature{
   name                  : string;
   type                  : FeatureType   = FeatureType.CUSTOM;
   private zipLocation   : string;
   private installScript : string;
   private version       : string;
   private user          : Schema;

   constructor(args : {name:string, version:string, username:string, password:string, installed:boolean, zipLocation:string, installScript:string}){
      this.name          = args.name;
      this.version       = args.version;
      this.zipLocation   = args.zipLocation;
      this.installScript = args.installScript;
      this.user          = new Schema({name: args.username, password: args.password, proxy:undefined});
   }

   public getType():FeatureType{
      return this.type;
   }
   
   public getName():string{
      return this.name;
   }

   public getInstallScript():string{
      return this.installScript;
   }

   public getVersion():string{
      return this.version;
   }

   public getUser():Schema{
      return this.user;
   }

   public isValid():boolean{
      return this.zipLocation.endsWith(`${this.name}.zip`) && fs.existsSync(this.zipLocation);
   }

   public copyToDependencies(project:Project):void{
      if(!fs.existsSync(`${project.getDependenciesPath()}/${this.name}.zip`)){
         fs.copyFileSync(this.zipLocation,`${project.getDependenciesPath()}/${this.name}.zip`);
      }
   }

}