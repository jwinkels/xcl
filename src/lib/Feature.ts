import { Schema } from "./Schema";

export enum FeatureType{
   CUSTOM = "CUSTOM",
   DB     = "DB",
   DEPLOY = "DEPLOY"
}

export interface Feature{
   name:string;
   type:FeatureType;

   getType():FeatureType;
   getName():string;
   getVersion():string;
   getUser():Schema;
   getCreates():string[];
}

