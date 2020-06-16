export class Schema{
    private name:string;
    private password:string;
    private proxy:Schema|undefined;

    constructor (args:{name:string, password:string, proxy:Schema|undefined}){
        this.name=args.name;
        this.password=args.password;
        this.proxy=args.proxy;
    }

    public getName():string{
        if(this.proxy){
            return this.proxy.getName()+'['+this.name+']';
        }else{
            return this.name;
        }
    }

    public getPassword():string{
        if (this.proxy){
            return this.proxy.getPassword();
        }else{
            return this.password
        };
    }

    public setName(name:string){
        this.name=name;
    }

    public setPassword(password:string){
        this.password=password;
    }
}