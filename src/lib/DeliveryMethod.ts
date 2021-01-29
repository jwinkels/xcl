import { injectable, inject, targetName } from 'inversify';
import { ProjectFeature } from './ProjectFeature';

export interface DeliveryMethod{
    install(feature:ProjectFeature, projectPath:string)   : void;
    build(projectName:string, version:string, mode:string )     : void;    
    deploy(projectName:string, connection:string, password:string, schemaOnly:boolean, ords:string, silentMode:boolean, version:string, mode:string) : void;
  //  remove()    : void;
}