import { Container } from "inversify";
import { DeliveryMethod } from "./DeliveryMethod"
import { Orcas } from "./Orcas"
import { Bash } from "./Bash"

const deliveryFactory=new Container();

deliveryFactory.bind<DeliveryMethod>("Method").to(Orcas).whenTargetNamed("ORCAS");
deliveryFactory.bind<DeliveryMethod>("Method").to(Bash).whenTargetNamed("BASH");

export { deliveryFactory };