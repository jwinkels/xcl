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
xcl/0.1.0 win32-x64 node-v13.3.0
$ xcl --help [COMMAND]
USAGE
  $ xcl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`xcl config:defaults [FILE]`](#xcl-configdefaults-file)
* [`xcl config:github USER`](#xcl-configgithub-user)
* [`xcl feature:add FEATURE VERSION [USERNAME] [PASSWORD] [PROJECT]`](#xcl-featureadd-feature-version-username-password-project)
* [`xcl feature:deinstall FEATURE [PROJECT]`](#xcl-featuredeinstall-feature-project)
* [`xcl feature:install FEATURE [PROJECT]`](#xcl-featureinstall-feature-project)
* [`xcl feature:list [TYPE] [PROJECT]`](#xcl-featurelist-type-project)
* [`xcl feature:remove FEATURE [PROJECT]`](#xcl-featureremove-feature-project)
* [`xcl feature:update FEATURE VERSION [PROJECT]`](#xcl-featureupdate-feature-version-project)
* [`xcl feature:versions FEATURE`](#xcl-featureversions-feature)
* [`xcl hello [FILE]`](#xcl-hello-file)
* [`xcl help [COMMAND]`](#xcl-help-command)
* [`xcl project:build [PROJECT] [VERSION]`](#xcl-projectbuild-project-version)
* [`xcl project:create PROJECT`](#xcl-projectcreate-project)
* [`xcl project:deploy [PROJECT]`](#xcl-projectdeploy-project)
* [`xcl project:init [PROJECT]`](#xcl-projectinit-project)
* [`xcl project:list [FILE]`](#xcl-projectlist-file)
* [`xcl project:prepare [FILE]`](#xcl-projectprepare-file)
* [`xcl project:remove PROJECT`](#xcl-projectremove-project)

## `xcl config:defaults [FILE]`

describe the command here

```
USAGE
  $ xcl config:defaults [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\config\defaults.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\config\defaults.ts)_

## `xcl config:github USER`

Save Github credentials to avoid max API-Call Problems

```
USAGE
  $ xcl config:github USER

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\config\github.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\config\github.ts)_

## `xcl feature:add FEATURE VERSION [USERNAME] [PASSWORD] [PROJECT]`

add Feature to dependency list

```
USAGE
  $ xcl feature:add FEATURE VERSION [USERNAME] [PASSWORD] [PROJECT]

ARGUMENTS
  FEATURE   Name of the Feature to add
  VERSION   Version of the Feature
  USERNAME  schema name for the feature to be installed in
  PASSWORD  password for the new schema
  PROJECT   Name of the Project (when not in a xcl-Project path)

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\feature\add.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\add.ts)_

## `xcl feature:deinstall FEATURE [PROJECT]`

deinstall a Feature from Database

```
USAGE
  $ xcl feature:deinstall FEATURE [PROJECT]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  (required) connection string HOST:PORT/SERVICE_NAME
  -h, --help                   show CLI help
  -o, --owner                  drop owner schema
  -p, --syspw=syspw            (required) Password of SYS-User
```

_See code: [src\commands\feature\deinstall.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\deinstall.ts)_

## `xcl feature:install FEATURE [PROJECT]`

install a Feature to target Schema

```
USAGE
  $ xcl feature:install FEATURE [PROJECT]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  (required) connection string HOST:PORT/SERVICE_NAME
  -h, --help                   show CLI help
  -p, --syspw=syspw            (required) Password of SYS-User
```

_See code: [src\commands\feature\install.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\install.ts)_

## `xcl feature:list [TYPE] [PROJECT]`

lists all available Features

```
USAGE
  $ xcl feature:list [TYPE] [PROJECT]

ARGUMENTS
  TYPE     [default: ALL] Show all Features of type [DB or DEPLOY]
  PROJECT  [default: all] Show Features added to a Project (when not in a XCL-Directory it shows all Features available)

OPTIONS
  -a, --all   show all Features available
  -h, --help  show CLI help
```

_See code: [src\commands\feature\list.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\list.ts)_

## `xcl feature:remove FEATURE [PROJECT]`

remove Feature from Project

```
USAGE
  $ xcl feature:remove FEATURE [PROJECT]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  Name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  connection to database (required when deinstall Feature) [ HOST:PORT/SERVICE_NAME ]
  -d, --deinstall              deinstall Feature from database
  -h, --help                   show CLI help
  -o, --owner                  drop Feature owner schema
  -p, --syspw=syspw            password of SYS-User
```

_See code: [src\commands\feature\remove.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\remove.ts)_

## `xcl feature:update FEATURE VERSION [PROJECT]`

update Project Feature version

```
USAGE
  $ xcl feature:update FEATURE VERSION [PROJECT]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  VERSION  Version of the Feature
  PROJECT  name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  (required)
  -h, --help                   show CLI help
  -p, --syspw=syspw            (required)
```

_See code: [src\commands\feature\update.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\update.ts)_

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

_See code: [src\commands\feature\versions.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\feature\versions.ts)_

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

_See code: [src\commands\hello.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\hello.ts)_

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

## `xcl project:build [PROJECT] [VERSION]`

create build to deploy

```
USAGE
  $ xcl project:build [PROJECT] [VERSION]

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\project\build.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\build.ts)_

## `xcl project:create PROJECT`

create a project

```
USAGE
  $ xcl project:create PROJECT

ARGUMENTS
  PROJECT  name of the project to create

OPTIONS
  -h, --help                 show CLI help
  -w, --workspace=workspace
```

_See code: [src\commands\project\create.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\create.ts)_

## `xcl project:deploy [PROJECT]`

deploy the project

```
USAGE
  $ xcl project:deploy [PROJECT]

OPTIONS
  -c, --connection=connection  (required) connection string HOST:PORT/SERVICE_NAME
  -d, --dependencies           Deploy inclusive dependencies (you will be asked for sys-user password)
  -h, --help                   show CLI help
  -p, --password=password      (required) Password for Deployment User

  -s, --syspw=syspw            Provide sys-password for silent mode dependency installation [IMPORTANT: All existing
                               users will be overwritten!]

  --schema-only                Deploys only schema objects
```

_See code: [src\commands\project\deploy.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\deploy.ts)_

## `xcl project:init [PROJECT]`

initialize a project

```
USAGE
  $ xcl project:init [PROJECT]

ARGUMENTS
  PROJECT  name of the project to initialze

OPTIONS
  -c, --connect=connect    Connectstring ex. localhost:1521/xepdb1
  -f, --force              Attention: forces dropping existing schemas
  -h, --help               show CLI help
  -p, --password=password  Password of user sys
  -y, --yes                Answers force-action with yes (Use with caution)
```

_See code: [src\commands\project\init.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\init.ts)_

## `xcl project:list [FILE]`

lists all known xcl projects

```
USAGE
  $ xcl project:list [FILE]

OPTIONS
  -h, --help  show CLI help
```

_See code: [src\commands\project\list.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\list.ts)_

## `xcl project:prepare [FILE]`

describe the command here

```
USAGE
  $ xcl project:prepare [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print
```

_See code: [src\commands\project\prepare.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\prepare.ts)_

## `xcl project:remove PROJECT`

removes project

```
USAGE
  $ xcl project:remove PROJECT

ARGUMENTS
  PROJECT  name of the project to remove

OPTIONS
  -c, --connection=connection
  -d, --database
  -h, --help                   show CLI help
  -p, --path
  -s, --syspw=syspw
```

_See code: [src\commands\project\remove.ts](https://github.com/MaikMichel/xcl/blob/v0.1.0/src\commands\project\remove.ts)_
<!-- commandsstop -->
