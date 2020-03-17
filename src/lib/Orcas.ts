import { injectable, inject } from "inversify";
import "reflect-metadata";
import { DeliveryMethod } from "./DeliveryMethod";

@injectable()
class Orcas implements DeliveryMethod{
    public install(){
        console.log("You have chosen ORCAS!!!");
    }
}

export { Orcas };