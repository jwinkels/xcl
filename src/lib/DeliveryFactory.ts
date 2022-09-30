import { Container } from "inversify";
import { DeliveryMethod } from "./DeliveryMethod"
import { Orcas } from "./Orcas"
import { DBFlow } from "./DBFlow"
import { Liquibase } from "./Liquibase"

const deliveryFactory=new Container();

deliveryFactory.bind<DeliveryMethod>("Method").to(Orcas).whenTargetNamed("ORCAS");
deliveryFactory.bind<DeliveryMethod>("Method").to(DBFlow).whenTargetNamed("DBFLOW");
deliveryFactory.bind<DeliveryMethod>("Method").to(Liquibase).whenTargetNamed("LIQUIBASE");


export { deliveryFactory };