import {expect, test} from '@oclif/test'

describe('config:defaults', () => {
  test
  .stdout()
  .command(['config:defaults'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['config:defaults', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
