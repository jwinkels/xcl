import * as path from 'path'; 
import * as winston from "winston";

export class Logger{

   private path:string = '';
   private logFileName = 'xcl.log';
   private logger:winston.Logger;
   private fileLogger:winston.Logger;
   

   constructor(uri:string){
      this.path = uri;

      const levels = {
         error: 0,
         warn: 1,
         info: 2,
         http: 3,
         debug: 4,
      }

      const transports = [
         new winston.transports.Console(),
         new winston.transports.File({ filename: path.join(this.path, this.logFileName) })
      ];

      const format = winston.format.combine(
         // Add the message timestamp with the preferred format
         winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
         // Define the format of the message showing the timestamp, the level and the message
         winston.format.printf(
           (info) => `${info.timestamp}: ${info.message}`,
         ),
       );

       /*[
         transports.file
       ]*/
      
      this.logger=winston.createLogger({
         level: "info",
         levels: levels,
         transports: transports,
         format: format
       });

      this.fileLogger=winston.createLogger({
         level: "info",
         levels: levels,
         transports: [new winston.transports.File({ filename: path.join(this.path, this.logFileName) })],
         format: format
      });
   }

   public setLogFile(uri:string){
      this.path = uri;
   }

   public getLogger(){
      return this.logger;
   }

   public getFileLogger(){
      return this.fileLogger;
   }
};