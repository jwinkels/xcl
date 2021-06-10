import { Container } from "inversify";
import { DeliveryMethod } from "./DeliveryMethod"
import { Orcas } from "./Orcas"
import { DBFlow } from "./DBFlow"

const deliveryFactory=new Container();

deliveryFactory.bind<DeliveryMethod>("Method").to(Orcas).whenTargetNamed("ORCAS");
deliveryFactory.bind<DeliveryMethod>("Method").to(DBFlow).whenTargetNamed("DBFLOW");


export { deliveryFactory };