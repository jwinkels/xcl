import {expect, test} from '@oclif/test'

describe('project:remove', () => {
  test
    .stdout()
    .command(['project:remove'])
    .it('runs hello', ctx => {
      expect(ctx.stdout).to.contain('hello world')
    })

  test
    .stdout()
    .command(['project:remove', '--name', 'jeff'])
    .it('runs hello --name jeff', ctx => {
      expect(ctx.stdout).to.contain('hello jeff')
    })
})
