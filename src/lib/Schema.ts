export class Schema{
    private name:string;
    private password:string;
    private proxy:Schema|undefined;

    constructor (args:{name:string, password:string, proxy:Schema|undefined}){
        this.name=args.name;
        this.password=args.password;
        this.proxy=args.proxy;
    }

    public getConnectionName():string{
        if(this.proxy){
            return this.proxy.getConnectionName()+'['+this.name+']';
        }else{
            return this.name;
        }
    }

    public getName():string{
        return this.name;
    }

    public getProxy():Schema|undefined{
        return this.proxy;
    }

    public getPassword():string{
        if (this.proxy){
            return this.proxy.getPassword();
        }else{
            return this.password
        }
    }

    public setName(name:string):void{
        this.name=name;
    }

    public setPassword(password:string):void{
        this.password=password;
    }
}