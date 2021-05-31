import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './ProjectFeature';
import * as fs from "fs-extra"
import { ShellHelper } from "./ShellHelper";
import { ProjectManager } from "./ProjectManager";

@injectable()
class Bash implements DeliveryMethod{
    public install(feature:ProjectFeature, projectPath:string){
        console.log("You have chosen Bash!!!");
        let featurePath = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
        fs.copySync(featurePath + '/.bash4xcl', 
                    projectPath + '/.bash4xcl');
    }

    public deploy(projectName:string, connection:string, password:string, schemaOnly:boolean, ords:string, silentMode:boolean, version:string, mode:string) {
        console.log("projectName", projectName);
        console.log("version", version);
        console.log("mode", mode);
        let project=ProjectManager.getInstance().getProject(projectName);
        const appSchema = project.getUsers().get('APP')?.getName();
        const dataSchema = project.getUsers().get('DATA')?.getName();
        const logicSchema = project.getUsers().get('LOGIC')?.getName();
        const proxyUserName = project.getUsers().get('DATA')?.getProxy()?.getName() || `${projectName}_depl`;
        ShellHelper.executeScriptWithEnv(`bash .bash4xcl/apply.sh ${mode} ${version}`, 
                                         project.getPath(), 
                                         {
                                           "PROJECT": project.getName(),
                                           "APP_SCHEMA": appSchema,
                                           "DATA_SCHEMA": dataSchema,
                                           "LOGIC_SCHEMA": logicSchema,
                                           "WORKSPACE": project.getName(),
                                           "SCHEMAS": `( ${dataSchema} ${logicSchema} ${appSchema} )`,
                                           "BRANCHES": `( develop test master )`, // TODO: das muss ausgelagert werden
                                           "DEPOT_PATH": `_depot`, // TODO: das muss ausgelagert werden
                                           "STAGE": `master`, // TODO: das muss ausgelagert werden
                                           "DB_APP_USER": proxyUserName,
                                           "DB_APP_PWD":`${password}`,
                                           "DB_TNS":`${connection}`,
                                           "USE_PROXY": "TRUE",
                                           "APP_OFFSET": 0
                                         });
        
    }
    
    
    public build(projectName:string, version:string, mode:string){
        console.log("projectName", projectName);
        console.log("version", version);
        console.log("mode", mode);
        let project=ProjectManager.getInstance().getProject(projectName);
        const appSchema = project.getUsers().get('APP')?.getConnectionName();
        const dataSchema = project.getUsers().get('DATA')?.getConnectionName();
        const logicSchema = project.getUsers().get('LOGIC')?.getConnectionName();
        ShellHelper.executeScriptWithEnv(`bash .bash4xcl/build.sh ${mode} ${version}`, 
                                         project.getPath(), 
                                         {
                                           "PROJECT": project.getName(),
                                           "APP_SCHEMA": appSchema,
                                           "DATA_SCHEMA": dataSchema,
                                           "LOGIC_SCHEMA": logicSchema,
                                           "WORKSPACE": project.getName(),
                                           "SCHEMAS": `( ${dataSchema} ${logicSchema} ${appSchema} )`,
                                           "BRANCHES": `( develop test master )`, // TODO: das muss ausgelagert werden
                                           "DEPOT_PATH": `_depot` // TODO: das muss ausgelagert werden
                                         });
    }
}

export { Bash };