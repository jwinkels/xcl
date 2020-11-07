import {expect, test} from '@oclif/test'

describe('project:plan', () => {
  test
  .stdout()
  .command(['project:plan'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['project:plan', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
