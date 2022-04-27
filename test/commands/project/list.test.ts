import {expect, test} from '@oclif/test'

describe('xcl project list', () => {
   test
   .stdout()
   .command(['project list'])
   .it('list all projects', ctx => {
      expect(ctx.stdout).not.empty;
      expect(ctx.stdout).contains('test');
   });
});