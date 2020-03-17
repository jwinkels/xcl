import { injectable, inject, targetName } from 'inversify';
import { ProjectFeature } from './projectFeature';

export interface DeliveryMethod{
    install(feature:ProjectFeature, projectPath:string)   : void;
  //  deploy()    : void;
  //  build()     : void;
  //  remove()    : void;
}