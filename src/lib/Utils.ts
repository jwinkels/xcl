import { existsSync, readFileSync, writeFileSync } from "fs-extra"
import { EOL } from "os";

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

    // read .env file & convert to array
    static getLinesFromFile = (file:string) => {
        if (existsSync(file)) {
            return readFileSync(file, "utf-8").split(EOL);
    } else {
            return [];
        }
    };

    static addLine = (file: string, content: string) => {
        const lines = Utils.getLinesFromFile(file);
        const targetLine = lines.find((line: string) => line === content);
        if (targetLine !== undefined) {
          // update existing line
          const targetLineIndex = lines.indexOf(targetLine);
          lines.splice(targetLineIndex, 1, `${content}`);
        } else {
          // create new line
          lines.push(`${content}`);
        }
        // write everything back to the file system
        writeFileSync(file, lines.join(EOL));
      };
}