import { Project } from './Project';
import { spawnSync } from 'child_process';
import * as path from 'path'
import { ProjectFeature } from './projectFeature';

const oracledb = require('oracledb');

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

    return conn;
  }

  public static async isProjectInstalled(project: Project, conn:IConnectionProperties):Promise<boolean> {
    let connection;
    let countSchemas:number = 0;
    try {
      connection = await oracledb.getConnection(conn);
      
      const result = await connection.execute(`SELECT count(1) FROM all_users where username like '${project.getName().toUpperCase}_%'`);
      countSchemas = result.rows[0][0];

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
      
      return Promise.resolve(countSchemas>0);
    }
  };

  public static async isFeatureInstalled(feature: ProjectFeature, conn:IConnectionProperties):Promise<boolean>{
    let connection;
    let userCount;
    try{
      connection = await oracledb.getConnection(conn);

      const result = await connection.execute(`SELECT count(1) FROM all_users where username like '${feature.getUser().getName().toUpperCase()}'`);
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

  public static getConnectionString(conn: IConnectionProperties):string {
    return  `${conn.user}/${conn.password}@${conn.connectString} as sysdba` 
  }

  public static async executeScript(conn: IConnectionProperties, script: string){
    
    
    console.log('executeScript', script);
    
    // Funzt noch nicht...
    const childProcess = spawnSync(
      'sql', // Sqlcl path should be in path
      [DBHelper.getConnectionString(conn)], {
        encoding: 'utf8',
        input: "@" + script,
        shell: true
      }
    );

    console.log("out: ", childProcess.stdout);  
  }

  
}