import {expect, test} from '@oclif/test'

describe('project:prepare', () => {
  test
    .stdout()
    .command(['project:prepare'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['project:prepare', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
