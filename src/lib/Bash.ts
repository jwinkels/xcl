import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";

@injectable()
class Bash implements DeliveryMethod{
    deploy(projectName: string): void {
        throw new Error("Method not implemented.");
    }
    
    public install(){
        console.log("You have chosen Bash!!!");
    }

    public build(){
        
    }
}

export { Bash };