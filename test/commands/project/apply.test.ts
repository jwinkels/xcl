import {expect, test} from '@oclif/test'

describe('project:apply', () => {
  test
  .stdout()
  .command(['project:apply'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['project:apply', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
