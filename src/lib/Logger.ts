import * as fs from "fs-extra";
import { Utils } from './Utils';
import * as path from 'path'; 
import * as winston from "winston";

export class Logger{

   private path:string = '';
   private logFileName = 'xcl.log';
   private logger:winston.Logger;
   

   constructor(uri:string){
      this.path = uri;
      const transports = {
         console: new winston.transports.Console({ level: 'info' }),
         file: new winston.transports.File({ filename: path.join(this.path, this.logFileName), level: 'info' })
      };
      
      this.logger=winston.createLogger({
         transports: [
           transports.file
         ]
       });
   }

   public setLogFile(uri:string){
      this.path = uri;
   }

   public getLogger(){
      return this.logger;
   }
};