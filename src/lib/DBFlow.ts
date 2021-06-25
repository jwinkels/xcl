import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './ProjectFeature';
import * as fs from "fs-extra"
import * as path from "path";
import { ShellHelper } from "./ShellHelper";
import { ProjectManager } from "./ProjectManager";
import chalk from 'chalk';
import cli from 'cli-ux'
import { Project } from "./Project";

@injectable()
export class DBFlow implements DeliveryMethod{
    public async install(feature:ProjectFeature, projectPath:string){
        console.log("You have chosen dbFlow!!!");
        let featurePath = projectPath + '/dependencies/' + feature.getName() + '_' + feature.getReleaseInformation();
        fs.copySync(featurePath, projectPath + '/.dbFlow');
        fs.removeSync(featurePath);

        // init git
        if (!fs.pathExistsSync(path.join(projectPath, '.git'))) {
          const initGit = await cli.prompt('Project has to be a git repositoy. Do you want to git init [Y/N] ', {type: 'normal'});
          if (initGit.toUpperCase() === "Y") {
            ShellHelper.executeScript(`git init`, projectPath, true);
          }
        }
    }

    public deploy(projectName:string, connection:string, password:string, schemaOnly:boolean, ords:string, silentMode:boolean, version:string, mode:string) {
        console.log("projectName", projectName);
        console.log("version", version);
        console.log("mode", mode);
        let project=ProjectManager.getInstance().getProject(projectName);
        const appSchema = project.getUsers().get('APP')?.getName();
        const dataSchema = project.getMode() === Project.MODE_SINGLE ? appSchema : project.getUsers().get('DATA')?.getName();
        const logicSchema = project.getMode() === Project.MODE_SINGLE ? appSchema : project.getUsers().get('LOGIC')?.getName();

        const proxyUserName =project.getMode() === Project.MODE_SINGLE ? appSchema : project.getUsers().get('DATA')?.getProxy()?.getName() || `${projectName}_depl`;
        ShellHelper.executeScriptWithEnv(`bash .dbFLow/apply.sh ${mode} ${version}`,
                                         project.getPath(),
                                         {
                                           "PROJECT": project.getName(),
                                           "APP_SCHEMA": appSchema,
                                           "DATA_SCHEMA": dataSchema,
                                           "LOGIC_SCHEMA": logicSchema,
                                           "WORKSPACE": project.getName(),
                                           "SCHEMAS": `( ${dataSchema} ${logicSchema} ${appSchema} )`,
                                           //"SCHEMASDELIMITED": `${dataSchema},${logicSchema},${appSchema}`,
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
      let project=ProjectManager.getInstance().getProject(projectName);
      // check if git is installed
      if (fs.pathExistsSync(path.join(project.getPath(), '.git'))) {
        console.log("projectName", projectName);
        console.log("version", version);
        console.log("mode", mode);
        const appSchema = project.getUsers().get('APP')?.getName();
        const dataSchema = project.getUsers().get('DATA')?.getName();
        const logicSchema = project.getUsers().get('LOGIC')?.getName();
        ShellHelper.executeScriptWithEnv(`bash .dbFlow/build.sh ${mode} ${version}`,
                                         project.getPath(),
                                         {
                                           "PROJECT": project.getName(),
                                           "APP_SCHEMA": appSchema,
                                           "DATA_SCHEMA": dataSchema,
                                           "LOGIC_SCHEMA": logicSchema,
                                           "WORKSPACE": project.getName(),
                                           "SCHEMASDELIMITED": `${dataSchema},${logicSchema},${appSchema}`,
                                           "BRANCHES": `( develop test master )`, // TODO: das muss ausgelagert werden
                                           "DEPOT_PATH": `_depot` // TODO: das muss ausgelagert werden
                                         });
      } else {
        console.log(chalk.redBright('Error: current folder is not a git folder'));
      }
    }
}
