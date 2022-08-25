import {expect, test} from '@oclif/test'
import { ProjectManager } from '../../../src/lib/ProjectManager';

describe('xcl project build', () => {
   test
   .it('only changed projects',  async()=>{
      let fileList:string = `apex/f1300/application/pages/page_00210.sql`;
      let regexp:RegExp = new RegExp("f\d{3,4}","gm");
      let reg:RegExp = /f\d{3,4}/gm;


      expect(reg.exec(fileList)?.length).equals(1);
   });
});