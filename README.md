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
xcl/1.0.2-beta.0 win32-x64 node-v16.5.0
$ xcl --help [COMMAND]
USAGE
  $ xcl COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`xcl autocomplete [SHELL]`](#xcl-autocomplete-shell)
* [`xcl config`](#xcl-config)
* [`xcl config:defaults [VARIABLE] [VALUE] [PROJECT]`](#xcl-configdefaults-variable-value-project)
* [`xcl config:github USER`](#xcl-configgithub-user)
* [`xcl feature`](#xcl-feature)
* [`xcl feature:add FEATURE [PROJECT] [USERNAME] [PASSWORD] [VERSION]`](#xcl-featureadd-feature-project-username-password-version)
* [`xcl feature:deinstall FEATURE [PROJECT]`](#xcl-featuredeinstall-feature-project)
* [`xcl feature:install FEATURE PROJECT`](#xcl-featureinstall-feature-project)
* [`xcl feature:list [TYPE] [PROJECT]`](#xcl-featurelist-type-project)
* [`xcl feature:remove FEATURE [PROJECT]`](#xcl-featureremove-feature-project)
* [`xcl feature:update FEATURE [VERSION] [PROJECT]`](#xcl-featureupdate-feature-version-project)
* [`xcl feature:versions FEATURE`](#xcl-featureversions-feature)
* [`xcl help [COMMAND]`](#xcl-help-command)
* [`xcl project`](#xcl-project)
* [`xcl project:apply [PROJECT]`](#xcl-projectapply-project)
* [`xcl project:build [PROJECT]`](#xcl-projectbuild-project)
* [`xcl project:create [PROJECT]`](#xcl-projectcreate-project)
* [`xcl project:deploy [PROJECT]`](#xcl-projectdeploy-project)
* [`xcl project:init [PROJECT]`](#xcl-projectinit-project)
* [`xcl project:list`](#xcl-projectlist)
* [`xcl project:plan [PROJECT]`](#xcl-projectplan-project)
* [`xcl project:remove PROJECT`](#xcl-projectremove-project)
* [`xcl project:reset [COMMIT] [PROJECT]`](#xcl-projectreset-commit-project)

## `xcl autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ xcl autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ xcl autocomplete
  $ xcl autocomplete bash
  $ xcl autocomplete zsh
  $ xcl autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v1.3.0/src/commands/autocomplete/index.ts)_

## `xcl config`

config environment variables or github credentials

```
USAGE
  $ xcl config

EXAMPLE
  $ xcl config [default|github]
```

_See code: [build/commands/config/index.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/config/index.ts)_

## `xcl config:defaults [VARIABLE] [VALUE] [PROJECT]`

set xcl environment variables

```
USAGE
  $ xcl config:defaults [VARIABLE] [VALUE] [PROJECT]

ARGUMENTS
  VARIABLE  the project in which you would like to set the variable
  VALUE     value of the variable you chose to set
  PROJECT   [default: all] the project in which you would like to set the variable

OPTIONS
  -h, --help      Show CLI help.
  -l, --list      list environment variables
  -r, --reset     resets an environment variable
  --reset-all     resets all environment variables
  --set-all       set all available environment variables
  --set-required  set all required environment variables
```

_See code: [build/commands/config/defaults.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/config/defaults.ts)_

## `xcl config:github USER`

Save Github credentials to avoid max API-Call Problems

```
USAGE
  $ xcl config:github USER

OPTIONS
  -h, --help  Show CLI help.
```

_See code: [build/commands/config/github.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/config/github.ts)_

## `xcl feature`

add, remove or update a feature

```
USAGE
  $ xcl feature

EXAMPLE
  $ xcl feature [add|deinstall|install|list|remove|update|versions] #FEATURE#
```

_See code: [build/commands/feature/index.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/index.ts)_

## `xcl feature:add FEATURE [PROJECT] [USERNAME] [PASSWORD] [VERSION]`

add Feature to dependency list

```
USAGE
  $ xcl feature:add FEATURE [PROJECT] [USERNAME] [PASSWORD] [VERSION]

ARGUMENTS
  FEATURE   Name of the Feature to add
  PROJECT   Name of the Project (when not in a xcl-Project path)
  USERNAME  schema name for the feature to be installed in
  PASSWORD  password for the new schema
  VERSION   Version of the Feature

OPTIONS
  -h, --help         Show CLI help.
  -i, --interactive  interactive mode
```

_See code: [build/commands/feature/add.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/add.ts)_

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
  -d, --drop                   drop owner schema
  -h, --help                   Show CLI help.
  -s, --syspw=syspw            (required) Password of SYS-User
```

_See code: [build/commands/feature/deinstall.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/deinstall.ts)_

## `xcl feature:install FEATURE PROJECT`

install a Feature to target Schema

```
USAGE
  $ xcl feature:install FEATURE PROJECT

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  [default: 192.168.99.101:1521/XEPDB1] connection string HOST:PORT/SERVICE_NAME
  -h, --help                   Show CLI help.
  -s, --syspw=syspw            Password of SYS-User
```

_See code: [build/commands/feature/install.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/install.ts)_

## `xcl feature:list [TYPE] [PROJECT]`

lists all available Features

```
USAGE
  $ xcl feature:list [TYPE] [PROJECT]

ARGUMENTS
  TYPE     [default: all] Show all Features of type [DB or DEPLOY]
  PROJECT  [default: all] Show Features added to a Project (when not in a XCL-Directory it shows all Features available)

OPTIONS
  -a, --all   show all Features available
  -h, --help  Show CLI help.
```

_See code: [build/commands/feature/list.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/list.ts)_

## `xcl feature:remove FEATURE [PROJECT]`

remove Feature from Project

```
USAGE
  $ xcl feature:remove FEATURE [PROJECT]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  Name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  [default: 192.168.99.101:1521/XEPDB1] connection to database (required when deinstall
                               Feature) [ HOST:PORT/SERVICE_NAME ]

  -d, --deinstall              deinstall Feature from database

  -h, --help                   Show CLI help.

  -o, --owner                  drop Feature owner schema

  -s, --syspw=syspw            password of SYS-User
```

_See code: [build/commands/feature/remove.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/remove.ts)_

## `xcl feature:update FEATURE [VERSION] [PROJECT]`

update Project Feature version

```
USAGE
  $ xcl feature:update FEATURE [VERSION] [PROJECT]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  VERSION  Version of the Feature
  PROJECT  name of the Project (when not in a xcl-Project path)

OPTIONS
  -c, --connection=connection  (required) [default: 192.168.99.101:1521/XEPDB1] connection string HOST:PORT/SERVICE_NAME
  -h, --help                   shows this help
  -s, --syspw=syspw            Password of SYS-User
```

_See code: [build/commands/feature/update.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/update.ts)_

## `xcl feature:versions FEATURE`

lists all available Releases of the Feature

```
USAGE
  $ xcl feature:versions FEATURE

ARGUMENTS
  FEATURE  name of the feature

OPTIONS
  -h, --help  Show CLI help.
```

_See code: [build/commands/feature/versions.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/versions.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.18/src/commands/help.ts)_

## `xcl project`

setup or manage your project

```
USAGE
  $ xcl project

EXAMPLE
  $ xcl project [apply|build|create|deploy|list|plan|remove|reset]
```

_See code: [build/commands/project/index.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/index.ts)_

## `xcl project:apply [PROJECT]`

apply a plan to a project

```
USAGE
  $ xcl project:apply [PROJECT]

ARGUMENTS
  PROJECT  name of the project that a plan should be applied to

OPTIONS
  -h, --help  Show CLI help.
```

_See code: [build/commands/project/apply.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/apply.ts)_

## `xcl project:build [PROJECT]`

create build to deploy

```
USAGE
  $ xcl project:build [PROJECT]

ARGUMENTS
  PROJECT  name of the project that should be build

OPTIONS
  -c, --commit=commit    commit or tag to build the deliverable
  -h, --help             Show CLI help.
  -m, --mode=mode        mode of build (init/patch)
  -v, --version=version  Version to tag build
```

_See code: [build/commands/project/build.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/build.ts)_

## `xcl project:create [PROJECT]`

creates a project including a new directory and the configured folder structure

```
USAGE
  $ xcl project:create [PROJECT]

ARGUMENTS
  PROJECT  name of the project to create

OPTIONS
  -h, --help                 Show CLI help.
  -i, --interactive          Interactive wizard that guides you through the creation of the project
  -w, --workspace=workspace  workspace name the application should be installed in
  --single-schema            one schema instead of three, no deployment user
```

_See code: [build/commands/project/create.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/create.ts)_

## `xcl project:deploy [PROJECT]`

deploy the project or build

```
USAGE
  $ xcl project:deploy [PROJECT]

ARGUMENTS
  PROJECT  Name of the project that should be deployed

OPTIONS
  -b, --build=build            build-number to deploy
  -c, --connection=connection  (required) [default: 192.168.99.101:1521/XEPDB1] connection string HOST:PORT/SERVICE_NAME
  -d, --dependencies           Deploy inclusive dependencies (you will be asked for sys-user password)
  -h, --help                   Show CLI help.
  -m, --mode=mode              [default: dev] mode of build (init/patch/dev)
  -p, --password=password      Password for Deployment User

  -s, --syspw=syspw            Provide sys-password for silent mode dependency installation [IMPORTANT: All existing
                               users will be overwritten!]

  -y, --yes                    Automatic proceed to the next schema without asking

  --nocompile                  ignore invalid objects on deploy

  --ords-url=ords-url          [IP/SERVERNAME]:PORT

  --quiet                      suppress output

  --schema=schema              to deploy a single schema type one of the following: [data, logic, app]

  --schema-only                Deploys only schema objects
```

_See code: [build/commands/project/deploy.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/deploy.ts)_

## `xcl project:init [PROJECT]`

initializes a project

```
USAGE
  $ xcl project:init [PROJECT]

ARGUMENTS
  PROJECT  name of the project to initialze

OPTIONS
  -c, --connection=connection  [default: 192.168.99.101:1521/XEPDB1] Connectstring ex. localhost:1521/xepdb1
  -f, --force                  Attention: force will drop existing schemas
  -h, --help                   Show CLI help.
  -o, --objects                Install basic objects defined in setup directory
  -s, --syspw=syspw            Password of user sys
  -u, --users                  Install standard schemas APP, LOGIC, DATA, DEPL
  -y, --yes                    Answers force-action with yes (Use with caution)
```

_See code: [build/commands/project/init.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/init.ts)_

## `xcl project:list`

lists all xcl projects

```
USAGE
  $ xcl project:list

OPTIONS
  -h, --help  Show CLI help.
```

_See code: [build/commands/project/list.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/list.ts)_

## `xcl project:plan [PROJECT]`

generate commands to bring the project up to date

```
USAGE
  $ xcl project:plan [PROJECT]

ARGUMENTS
  PROJECT  name of the project

OPTIONS
  -h, --help    Show CLI help.
  --auto-apply  proceed with apply after plan
  --yes         skip all prompts with answer 'yes'
```

_See code: [build/commands/project/plan.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/plan.ts)_

## `xcl project:remove PROJECT`

removes a project

```
USAGE
  $ xcl project:remove PROJECT

ARGUMENTS
  PROJECT  name of the project to remove

OPTIONS
  -c, --connection=connection
  -d, --database
  -h, --help                   Show CLI help.
  -p, --path
  -s, --syspw=syspw
```

_See code: [build/commands/project/remove.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/remove.ts)_

## `xcl project:reset [COMMIT] [PROJECT]`

reset project to commit id or tag

```
USAGE
  $ xcl project:reset [COMMIT] [PROJECT]

ARGUMENTS
  COMMIT   commit id or tag name
  PROJECT  name of the project that should be build

OPTIONS
  -h, --help  Show CLI help.
  -y, --yes   proceed without confirmation

EXAMPLE
  xcl project:reset
```

_See code: [build/commands/project/reset.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/reset.ts)_
<!-- commandsstop -->
