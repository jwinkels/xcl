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
}