//Imports
import * as yaml from "yaml";
import * as fs from "fs-extra";
import * as os from "os";
import chalk from 'chalk'
import { Feature } from './Feature';
import { integer } from '@oclif/command/lib/flags';
const Table = require('cli-table')

export class FeatureManager{
    public static softwareYMLfile: string = "software.yml";

    private static manager: FeatureManager;
    private static xclHome = os.homedir + "/AppData/Roaming/xcl";
    // private static project: Project;
    private static softwareYaml: yaml.ast.Document;
    private static softwareJson: any;
    private static features: Map<String, Feature>;

 

    private constructor(){
        FeatureManager.softwareYaml = yaml.parseDocument(fs.readFileSync(FeatureManager.xclHome + "/" 
                                                            + FeatureManager.softwareYMLfile).toString());

        // convert to json of create an empty definition
        FeatureManager.softwareJson = FeatureManager.softwareYaml.toJSON();
        FeatureManager.features = new Map();

        Object.keys(FeatureManager.softwareJson.software).forEach(function(softwareName){
          let softwareJSON = FeatureManager.softwareJson.software[softwareName];
          FeatureManager.features.set(softwareName, new Feature(softwareName, softwareJSON.owner, softwareJSON.repo, softwareJSON.call));
        });
    
        // what else belongs to FM?
    }

    static getInstance() {
        if (!FeatureManager.manager) {
          FeatureManager.manager = new FeatureManager();
        }
        return FeatureManager.manager;
      }

    public listFeatures() {
        const table = new Table({
          head: [        
            chalk.blueBright('name'),
            chalk.blueBright('github-repository'),
            chalk.blueBright('owner')
          ]
        });
        let feature:Feature;    
        /*const features:Feature[] = FeatureManager.getInstance().getFeatures();

        for (let i = 0; i < features.length; i++) {
          const feature = features[i];
          table.push([ feature.getName(), feature.getRepo(), feature.getOwner() ]);
        }*/

        for(feature of FeatureManager.features.values()){
          table.push([ feature.getName(), feature.getRepo(), feature.getOwner() ]);
        }
    
        console.log(table.toString());
      }

      public getFeatureReleases(name:string){
        const table = new Table({
          head: [        
            chalk.blueBright(name)
          ]
        });
        
        if(FeatureManager.features.has(name)){
          FeatureManager.features.get(name).getReleases().then(function(releases){
            for (let i=0; i<releases.length; i++){
              table.push([releases[i]]);
            }

            console.log(table.toString());

          });
        }else{
          throw Error('Unknown Feature: '+name+' Try: xcl feature:list');
        }
      }

}