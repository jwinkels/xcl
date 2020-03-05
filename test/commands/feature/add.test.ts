import {expect, test} from '@oclif/test'

describe('feature:add', () => {
  test
  .stdout()
  .command(['feature:add'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['feature:add', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
