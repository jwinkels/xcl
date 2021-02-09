import { ProjectFeature } from './ProjectFeature';

export interface DeliveryMethod{
    install(feature:ProjectFeature, projectPath:string)   : void;
    deploy(projectName:string, connection:string, password:string, schemaOnly:boolean, ords:string, silentMode:boolean)    : void;
    build(projectName:string, version:string)     : void;
  //  remove()    : void;
}