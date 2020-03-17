import { injectable, inject, targetName } from 'inversify';

export interface DeliveryMethod{
    install()   : void;
  //  deploy()    : void;
  //  build()     : void;
  //  remove()    : void;
}