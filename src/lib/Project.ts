export class Project{
    private name:string;
    private path:string;

    constructor(name:string, path:string){
        this.name=name;
        this.path=path;
    }

    public getPath():string{
        return this.path+"/"+this.name;
    }

    public getName():string{
        return this.name;
    }

    public toJSON():any{
        return {path: this.getPath()}
    }
}