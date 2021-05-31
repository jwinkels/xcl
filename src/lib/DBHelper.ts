import { Project } from './Project';
import { spawnSync } from 'child_process';
import { ProjectFeature } from './ProjectFeature';
import chalk from 'chalk'
import * as fs from "fs-extra";
import * as os from "os";

const oracledb = require('oracledb');
const xclHome = os.homedir() + "/AppData/Roaming/xcl";
const instant_client_path:string = xclHome + fs.readFileSync(xclHome+"/.instantClient").toString().trimEnd();
fs.existsSync(instant_client_path)?oracledb.initOracleClient({libDir: instant_client_path}):console.log('No Instant Client Installed in '+instant_client_path);
export interface IConnectionProperties {
  user: string,
  password: string,
  connectString: string,
  privilege?: any
}


export class DBHelper {
  public static getConnectionProps(pUserName?: string, 
                                   pPassWord?: string,
                                   pConnUrl?: string):IConnectionProperties {
    let conn:IConnectionProperties = {
      user          : "" + (pUserName || process.env.NODE_ORACLEDB_USER ),
      password      : "" + (pPassWord ||process.env.NODE_ORACLEDB_PASSWORD),
      connectString : "" + (pConnUrl || process.env.NODE_ORACLEDB_CONNECTIONSTRING),
      // could not find constant, so looked up at
      // https://github.com/oracle/node-oracledb/blob/master/doc/api.md#oracledbconstantsprivilege
      privilege     : pUserName === 'sys' ? 2 : undefined
    };  
    
    // console.debug(conn);

    try {          
      if ([conn.user, conn.password, conn.connectString].includes('undefined')) {
        throw new Error("Not all connection params have a value!");
      } 

      return conn;

    } catch (err) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  }

  public static async isProjectInstalled(project: Project, conn:IConnectionProperties):Promise<boolean> {
    let connection;
    let countSchemas:number = 0;
    try {
      connection = await oracledb.getConnection(conn);
      let query = `SELECT count(1) FROM all_users where username like '${project.getName().toUpperCase()}_%'`;
      // console.debug(query);
      
      const result = await connection.execute(query);
      // console.debug(result)
      
      countSchemas = result.rows[0][0];

    } catch (err) {
        console.error(chalk.red(err));
        process.exit(1);
    } finally {
      if (connection) {
        try {
          // Connections should always be released when not needed
          await connection.close();
        } catch (err) {
          console.error(chalk.red(err));
          process.exit(1);
        }
      }
      
      return Promise.resolve(countSchemas>0);
    }
  };

  public static async isFeatureInstalled(feature: ProjectFeature, conn:IConnectionProperties):Promise<boolean>{
    let connection;
    let userCount;
    try{
      connection = await oracledb.getConnection(conn);

      const result = await connection.execute(`SELECT count(1) FROM all_users where username like '${feature.getUser().getConnectionName().toUpperCase()}'`);
      userCount = result.rows[0][0];
    }catch(err){
      console.error(err,"{color:red}");
    }finally{
      if(connection) {
        try{
          await connection.close();
        }catch(err){
          console.error(err);
        }
      }
      return Promise.resolve(userCount > 0)
    }
  }


  public static async getOraVersion(conn:IConnectionProperties):Promise<number> {
    let connection;
    let version:number = 0;
    try {
      connection = await oracledb.getConnection(conn);
      let query = `select substr(version, 1, instr(version, '.', 1, 1)-1) 
      from product_component_version
     where product like 'Oracle Database %'`;

      console.log(query);
      
      const result = await connection.execute(query);
      console.log(result)
      
      version = result.rows[0][0];

    } catch (err) {
      console.error(err, "{color:red}");
    } finally {
      if (connection) {
        try {
          // Connections should always be released when not needed
          await connection.close();
        } catch (err) {
          console.error(err);
        }
      }
      
      return Promise.resolve(version);
    }
  };


  public static getConnectionString(conn: IConnectionProperties):string {
    
    return  `${conn.user}/${conn.password}@${conn.connectString}${conn.user === 'sys' ? ' as sysdba' : ''}` 
  }

  public static executeScript(conn: IConnectionProperties, script: string){
    
    fs.appendFileSync(process.cwd()+'/xcl.log', 'Start script: '+script); 
    
    const childProcess = spawnSync(
      'sql', // Sqlcl path should be in path
      [DBHelper.getConnectionString(conn)], {
        encoding: 'utf8',
        input: "@" + script,
        shell: true
      }
    );
    

    if (!childProcess.error){
      console.log(chalk.gray(childProcess.stdout));
      fs.appendFileSync(process.cwd()+'/xcl.log', childProcess.stdout); 
    }else{
      console.log(chalk.red(childProcess.error.message));
      fs.appendFileSync(process.cwd()+'/xcl.log', childProcess.error.message); 
    }
    
  }

  public static executeScriptIn(conn: IConnectionProperties, script: string, cwd:string){
    
    console.log(script);
    console.log(process.cwd());
    
    fs.appendFileSync(process.cwd()+'/xcl.log', 'Start script: '+script); 

    const childProcess = spawnSync(
      'sql', // Sqlcl path should be in path
      [DBHelper.getConnectionString(conn)], {
        encoding: 'utf8',
        cwd: cwd,
        input: "@" + script,
        shell: true
      }
    );
    
    if (!childProcess.error){
      console.log(chalk.gray(childProcess.stdout));
      fs.appendFileSync(process.cwd()+'/xcl.log', childProcess.stdout); 
    }else{
      console.log(chalk.red(childProcess.error.message));
      fs.appendFileSync(process.cwd()+'/xcl.log', childProcess.error.message); 
    }

  }

  
}