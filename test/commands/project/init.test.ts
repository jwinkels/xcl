import {expect, test} from '@oclif/test'
import { ProjectManager } from '../../../src/lib/ProjectManager';
describe('xcl project init', () => {
   test
   .it('password longer then 8 chars',  async()=>{
      let passw = await ProjectManager.getInstance().generatePassword();
      expect(passw.length).greaterThanOrEqual(8);
   });
});