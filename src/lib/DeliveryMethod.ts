import { injectable, inject, targetName } from 'inversify';
import { ProjectFeature } from './projectFeature';

export interface DeliveryMethod{
    install(feature:ProjectFeature, projectPath:string)   : void;
    deploy(projectName:string, connection:string)    : void;
    build(projectName:string, version:string)     : void;
  //  remove()    : void;
}