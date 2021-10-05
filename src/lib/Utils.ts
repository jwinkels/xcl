export class Utils{
    static enwrapInQuotes(aString:string):string {
        return '"'+aString+'"';
    }

    /**
     * 
     * Given a path the function searches for spaces and enwraps it in quotes when necessary
     */
    static checkPathForSpaces(path:string):string {
        if (path.includes(' ')){
            return this.enwrapInQuotes(path);
        }else{
            return path;
        }
    }
}