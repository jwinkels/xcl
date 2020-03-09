import {expect, test} from '@oclif/test'

describe('feature:remove', () => {
  test
  .stdout()
  .command(['feature:remove'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['feature:remove', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
