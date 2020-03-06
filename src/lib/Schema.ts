export class Schema{
    private name:string;
    private password:string;


    constructor (args:{name:string, password:string}){
        this.name=args.name;
        this.password=args.password;
    }

    public getName():string{
        return this.name;
    }

    public getPassword():string{
        return this.password;
    }

    public setName(name:string){
        this.name=name;
    }

    public setPassword(password:string){
        this.password=password;
    }
}