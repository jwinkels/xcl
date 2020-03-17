import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";

@injectable()
class Bash implements DeliveryMethod{
    public install(){
        console.log("You have chosen Bash!!!");
    }
}

export { Bash };