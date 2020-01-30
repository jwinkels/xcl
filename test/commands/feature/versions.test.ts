import {expect, test} from '@oclif/test'

describe('feature:versions', () => {
  test
  .stdout()
  .command(['feature:versions'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['feature:versions', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
