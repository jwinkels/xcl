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
* [`xcl config:github [USER]`](#xcl-configgithub-user)
* [`xcl feature:add FEATURE VERSION [PROJECT]`](#xcl-featureadd-feature-version-project)
* [`xcl feature:install [FILE]`](#xcl-featureinstall-file)
* [`xcl feature:list`](#xcl-featurelist)
* [`xcl feature:versions FEATURE`](#xcl-featureversions-feature)
* [`xcl hello [FILE]`](#xcl-hello-file)
* [`xcl help [COMMAND]`](#xcl-help-command)
* [`xcl project:create PROJECT`](#xcl-projectcreate-project)
* [`xcl project:init PROJECT`](#xcl-projectinit-project)
* [`xcl project:list [FILE]`](#xcl-projectlist-file)
* [`xcl project:remove PROJECT`](#xcl-projectremove-project)

## `xcl config:github [USER]`

Save Github credentials to avoid max API-Call Problems

```
USAGE
  $ xcl config:github [USER]

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\config\github.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\config\github.ts)_

## `xcl feature:add FEATURE VERSION [PROJECT]`

describe the command here

```
USAGE
  $ xcl feature:add FEATURE VERSION [PROJECT]

ARGUMENTS
  FEATURE  Name of the Feature to add
  VERSION  Version of the Feature
  PROJECT  name of the Project (when not in a xcl-Project path)

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\feature\add.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\feature\add.ts)_

## `xcl feature:install [FILE]`

describe the command here

```
USAGE
  $ xcl feature:install [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\feature\install.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\feature\install.ts)_

## `xcl feature:list`

lists all available Features

```
USAGE
  $ xcl feature:list

OPTIONS
  -a, --all              Show all Features available
  -h, --help             show CLI help
  -p, --project=project  (required) [default: all] Shows all Features of a Project
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

create a project

```
USAGE
  $ xcl project:create PROJECT

ARGUMENTS
  PROJECT  name of the project to create

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\project\create.ts](https://github.com/MaikMichel/xcl/blob/v0.0.0/src\commands\project\create.ts)_

## `xcl project:init PROJECT`

initialize a project

```
USAGE
  $ xcl project:init PROJECT

ARGUMENTS
  PROJECT  name of the project to initialze

OPTIONS
  -f, --force
  -h, --help             show CLI help
  -m, --machine=machine  machine or ip of database
  -p, --port=port        port where the listener works on
  -s, --service=service  servie/sid of the database
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
