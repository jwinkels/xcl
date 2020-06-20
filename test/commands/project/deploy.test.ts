import {expect, test} from '@oclif/test'

describe('project:deploy', () => {
  test
  .stdout()
  .command(['project:deploy'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['project:deploy', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
