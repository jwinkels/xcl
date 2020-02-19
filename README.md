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
xcl/0.0.0 win32-x64 node-v10.16.0
$ xcl --help [COMMAND]
USAGE
  $ xcl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`xcl feature:list`](#xcl-featurelist)
* [`xcl feature:versions FEATURE`](#xcl-featureversions-feature)
* [`xcl hello [FILE]`](#xcl-hello-file)
* [`xcl help [COMMAND]`](#xcl-help-command)
* [`xcl project:create PROJECT`](#xcl-projectcreate-project)
* [`xcl project:init [FILE]`](#xcl-projectinit-file)
* [`xcl project:list [FILE]`](#xcl-projectlist-file)
* [`xcl project:remove PROJECT`](#xcl-projectremove-project)

## `xcl feature:list`

lists all available Features

```
USAGE
  $ xcl feature:list

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\feature\list.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\feature\list.ts)_

## `xcl feature:versions FEATURE`

lists all available Releases of the Feature

```
USAGE
  $ xcl feature:versions FEATURE

ARGUMENTS
  FEATURE  name of the feature

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\feature\versions.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\feature\versions.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src\commands\help.ts)_

## `xcl project:create PROJECT`

create, list or remove a project

```
USAGE
  $ xcl project:create PROJECT

ARGUMENTS
  PROJECT  name of the project to create

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\project\create.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\create.ts)_

## `xcl project:init [FILE]`

describe the command here

```
USAGE
  $ xcl project:init [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\project\init.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\init.ts)_

## `xcl project:list [FILE]`

lists all known xcl projects

```
USAGE
  $ xcl project:list [FILE]

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\project\list.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\list.ts)_

## `xcl project:remove PROJECT`

removes project

```
USAGE
  $ xcl project:remove PROJECT

ARGUMENTS
  PROJECT  name of the project to remove

OPTIONS
  -d, --database
  -h, --help      show CLI help
  -p, --path
```

_See code: [src\commands\project\remove.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\remove.ts)_
<!-- commandsstop -->
