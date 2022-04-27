import {expect, test} from '@oclif/test'

describe('xcl config defaults --list', () => {
   test
   .stdout()
   .command(['config defaults', '--list'])
   .it('shows global configuration variables', ctx => {
      expect(ctx.stdout).not.empty;
      expect(ctx.stdout).contains('Global');
   });

   test
   .stdout()
   .command(['config defaults', 'project', '--list'])
   .it('shows configuration variables of project', ctx => {
      expect(ctx.stdout).not.empty;
      expect(ctx.stdout).not.contains('Global');
   });
});

describe('xcl config defaults set variable', () => {
   test
      .stdout()
      .command(['config defaults', 'connection', '192.168.99.101:1521/XEPDB1', 'test'])
      .it('set default variable to 192.168.99.101:1521/XEPDB1', ctx =>{
         expect(ctx.stdout).contains('OK');
      });
});