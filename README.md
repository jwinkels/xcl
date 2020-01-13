xcl
===

APEX commandline Utility

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/xcl.svg)](https://npmjs.org/package/xcl)
[![Downloads/week](https://img.shields.io/npm/dw/xcl.svg)](https://npmjs.org/package/xcl)
[![License](https://img.shields.io/npm/l/xcl.svg)](https://github.com/MaikMichel/xcl/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g xcl
$ xcl COMMAND
running command...
$ xcl (-v|--version|version)
xcl/0.0.0 win32-x64 node-v13.3.0
$ xcl --help [COMMAND]
USAGE
  $ xcl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`xcl hello [FILE]`](#xcl-hello-file)
* [`xcl help [COMMAND]`](#xcl-help-command)
* [`xcl project:create [FILE]`](#xcl-projectcreate-file)
* [`xcl project:list [FILE]`](#xcl-projectlist-file)

## `xcl hello [FILE]`

describe the command here

```
USAGE
  $ xcl hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ xcl hello
  hello world from ./src/hello.ts!
```

_See code: [src\commands\hello.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\hello.ts)_

## `xcl help [COMMAND]`

display help for xcl

```
USAGE
  $ xcl help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.2/src\commands\help.ts)_

## `xcl project:create [FILE]`

create a project

```
USAGE
  $ xcl project:create [FILE]

OPTIONS
  -h, --help       show CLI help
  -n, --name=name  Name of the Project to be created
```

_See code: [src\commands\project\create.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\create.ts)_

## `xcl project:list [FILE]`

describe the command here

```
USAGE
  $ xcl project:list [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\project\list.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\list.ts)_
<!-- commandsstop -->
