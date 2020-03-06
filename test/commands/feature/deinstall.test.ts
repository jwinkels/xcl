import {expect, test} from '@oclif/test'

describe('feature:deinstall', () => {
  test
  .stdout()
  .command(['feature:deinstall'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['feature:deinstall', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
