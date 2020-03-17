import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";
import { ProjectFeature } from './projectFeature';
import * as fs from "fs-extra"
import { ProjectManager } from './projectManager';


@injectable()
class Orcas implements DeliveryMethod{
    public install(feature:ProjectFeature, projectPath:string){
        let featurePath = projectPath + '/dependencies/'+feature.getName()+'_'+feature.getReleaseInformation();
        fs.copyFileSync(featurePath+'/app/build.gradle',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_app/build.gradle');
        fs.copyFileSync(featurePath+'/logic/build.gradle',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_logic/build.gradle');
        fs.copyFileSync(featurePath+'/data/build.gradle',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_data/build.gradle');
        
        fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_app/gradlew');
        fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_logic/gradlew');
        fs.copyFileSync(featurePath+'/gradlew',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_data/gradlew');

        fs.copyFileSync(featurePath+'/gradlew.bat',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_app/gradlew.bat');
        fs.copyFileSync(featurePath+'/gradlew.bat',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_logic/gradlew.bat');
        fs.copyFileSync(featurePath+'/gradlew.bat',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_data/gradlew.bat');
        
        
        fs.copySync(featurePath+'/gradle/',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_app/gradle/');
        fs.copySync(featurePath+'/gradle/',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_logic/gradle/');
        fs.copySync(featurePath+'/gradle/',projectPath+'/db/'+ProjectManager.getInstance().getProjectNameByPath(projectPath)+'_data/gradle/');

        fs.removeSync(featurePath);
    }
}

export { Orcas };