import {expect, test} from '@oclif/test'

describe('xcl feature', () => {
   test
   .stdout()
   .command(['feature list', '-a'])
   .it('list all available features', ctx => {
      expect(ctx.stdout).not.empty;
      expect(ctx.stdout).contains('utplsql');
   });

   test
   .stdout()
   .command(['feature versions', 'utplsql'])
   .it('list versions of utplsql features', ctx => {
      expect(ctx.stdout).not.empty;
      expect(ctx.stdout).contains('v3.1.12');
   });
});
