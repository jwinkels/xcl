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
$ xcl (--version)
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
* [`xcl config defaults [VARIABLE] [VALUE] [PROJECT]`](#xcl-config-defaults-variable-value-project)
* [`xcl config github USER`](#xcl-config-github-user)
* [`xcl feature`](#xcl-feature)
* [`xcl feature add FEATURE [PROJECT] [USERNAME] [PASSWORD] [VERSION]`](#xcl-feature-add-feature-project-username-password-version)
* [`xcl feature deinstall FEATURE [PROJECT]`](#xcl-feature-deinstall-feature-project)
* [`xcl feature install FEATURE PROJECT`](#xcl-feature-install-feature-project)
* [`xcl feature list [TYPE] [PROJECT]`](#xcl-feature-list-type-project)
* [`xcl feature remove FEATURE [PROJECT]`](#xcl-feature-remove-feature-project)
* [`xcl feature update FEATURE [VERSION] [PROJECT]`](#xcl-feature-update-feature-version-project)
* [`xcl feature versions FEATURE`](#xcl-feature-versions-feature)
* [`xcl help [COMMAND]`](#xcl-help-command)
* [`xcl project`](#xcl-project)
* [`xcl project apply [PROJECT]`](#xcl-project-apply-project)
* [`xcl project build [PROJECT]`](#xcl-project-build-project)
* [`xcl project create [PROJECT]`](#xcl-project-create-project)
* [`xcl project deploy [PROJECT]`](#xcl-project-deploy-project)
* [`xcl project init [PROJECT]`](#xcl-project-init-project)
* [`xcl project list`](#xcl-project-list)
* [`xcl project plan [PROJECT]`](#xcl-project-plan-project)
* [`xcl project remove PROJECT`](#xcl-project-remove-project)
* [`xcl project reset [COMMIT] [PROJECT]`](#xcl-project-reset-commit-project)

## `xcl autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ xcl autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  display autocomplete installation instructions

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

DESCRIPTION
  config environment variables or github credentials

EXAMPLES
  $ xcl config [default|github]
```

_See code: [build/commands/config/index.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/config/index.ts)_

## `xcl config defaults [VARIABLE] [VALUE] [PROJECT]`

set xcl environment variables

```
USAGE
  $ xcl config defaults [VARIABLE] [VALUE] [PROJECT] [-h] [-l] [--set-all] [--set-required] [-r] [--reset-all]

ARGUMENTS
  VARIABLE  the project in which you would like to set the variable
  VALUE     value of the variable you chose to set
  PROJECT   [default: all] the project in which you would like to set the variable

FLAGS
  -h, --help      Show CLI help.
  -l, --list      list environment variables
  -r, --reset     resets an environment variable
  --reset-all     resets all environment variables
  --set-all       set all available environment variables
  --set-required  set all required environment variables

DESCRIPTION
  set xcl environment variables
```

## `xcl config github USER`

Save Github credentials to avoid max API-Call Problems

```
USAGE
  $ xcl config github [USER] [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  Save Github credentials to avoid max API-Call Problems
```

## `xcl feature`

add, remove or update a feature

```
USAGE
  $ xcl feature

DESCRIPTION
  add, remove or update a feature

EXAMPLES
  $ xcl feature [add|deinstall|install|list|remove|update|versions] #FEATURE#
```

_See code: [build/commands/feature/index.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/feature/index.ts)_

## `xcl feature add FEATURE [PROJECT] [USERNAME] [PASSWORD] [VERSION]`

add Feature to dependency list

```
USAGE
  $ xcl feature add [FEATURE] [PROJECT] [USERNAME] [PASSWORD] [VERSION] [-h] [-i]

ARGUMENTS
  FEATURE   Name of the Feature to add
  PROJECT   Name of the Project (when not in a xcl-Project path)
  USERNAME  schema name for the feature to be installed in
  PASSWORD  password for the new schema
  VERSION   Version of the Feature

FLAGS
  -h, --help         Show CLI help.
  -i, --interactive  interactive mode

DESCRIPTION
  add Feature to dependency list
```

## `xcl feature deinstall FEATURE [PROJECT]`

deinstall a Feature from Database

```
USAGE
  $ xcl feature deinstall [FEATURE] [PROJECT] -c <value> -s <value> [-h] [-d]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  name of the Project (when not in a xcl-Project path)

FLAGS
  -c, --connection=<value>  (required) connection string HOST:PORT/SERVICE_NAME
  -d, --drop                drop owner schema
  -h, --help                Show CLI help.
  -s, --syspw=<value>       (required) Password of SYS-User

DESCRIPTION
  deinstall a Feature from Database
```

## `xcl feature install FEATURE PROJECT`

install a Feature to target Schema

```
USAGE
  $ xcl feature install [FEATURE] [PROJECT] [-h] [-c <value>] [-s <value>]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  name of the Project (when not in a xcl-Project path)

FLAGS
  -c, --connection=<value>  [default: 192.168.99.101:1521/XEPDB1] connection string HOST:PORT/SERVICE_NAME
  -h, --help                Show CLI help.
  -s, --syspw=<value>       Password of SYS-User

DESCRIPTION
  install a Feature to target Schema
```

## `xcl feature list [TYPE] [PROJECT]`

lists all available Features

```
USAGE
  $ xcl feature list [TYPE] [PROJECT] [-h] [-a]

ARGUMENTS
  TYPE     [default: all] Show all Features of type [DB or DEPLOY]
  PROJECT  [default: all] Show Features added to a Project (when not in a XCL-Directory it shows all Features available)

FLAGS
  -a, --all   show all Features available
  -h, --help  Show CLI help.

DESCRIPTION
  lists all available Features
```

## `xcl feature remove FEATURE [PROJECT]`

remove Feature from Project

```
USAGE
  $ xcl feature remove [FEATURE] [PROJECT] [-h] [-d] [-c <value>] [-s <value>] [-o]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  PROJECT  Name of the Project (when not in a xcl-Project path)

FLAGS
  -c, --connection=<value>  [default: 192.168.99.101:1521/XEPDB1] connection to database (required when deinstall
                            Feature) [ HOST:PORT/SERVICE_NAME ]
  -d, --deinstall           deinstall Feature from database
  -h, --help                Show CLI help.
  -o, --owner               drop Feature owner schema
  -s, --syspw=<value>       password of SYS-User

DESCRIPTION
  remove Feature from Project
```

## `xcl feature update FEATURE [VERSION] [PROJECT]`

update Project Feature version

```
USAGE
  $ xcl feature update [FEATURE] [VERSION] [PROJECT] -c <value> [-h] [-s <value>]

ARGUMENTS
  FEATURE  Name of the Project-Feature to be installed
  VERSION  Version of the Feature
  PROJECT  name of the Project (when not in a xcl-Project path)

FLAGS
  -c, --connection=<value>  (required) [default: 192.168.99.101:1521/XEPDB1] connection string HOST:PORT/SERVICE_NAME
  -h, --help                shows this help
  -s, --syspw=<value>       Password of SYS-User

DESCRIPTION
  update Project Feature version
```

## `xcl feature versions FEATURE`

lists all available Releases of the Feature

```
USAGE
  $ xcl feature versions [FEATURE] [-h]

ARGUMENTS
  FEATURE  name of the feature

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  lists all available Releases of the Feature
```

## `xcl help [COMMAND]`

display help for xcl

```
USAGE
  $ xcl help [COMMAND] [--all]

ARGUMENTS
  COMMAND  command to show help for

FLAGS
  --all  see all commands in CLI

DESCRIPTION
  display help for xcl
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.18/src/commands/help.ts)_

## `xcl project`

setup or manage your project

```
USAGE
  $ xcl project

DESCRIPTION
  setup or manage your project

EXAMPLES
  $ xcl project [apply|build|create|deploy|list|plan|remove|reset]
```

_See code: [build/commands/project/index.ts](https://github.com/MaikMichel/xcl/blob/v1.0.2-beta.0/build/commands/project/index.ts)_

## `xcl project apply [PROJECT]`

apply a plan to a project

```
USAGE
  $ xcl project apply [PROJECT] [-h]

ARGUMENTS
  PROJECT  name of the project that a plan should be applied to

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  apply a plan to a project
```

## `xcl project build [PROJECT]`

create build to deploy

```
USAGE
  $ xcl project build [PROJECT] [-h] [-m <value>] [-v <value>] [-c <value>]

ARGUMENTS
  PROJECT  name of the project that should be build

FLAGS
  -c, --commit=<value>   commit or tag to build the deliverable
  -h, --help             Show CLI help.
  -m, --mode=<value>     mode of build (init/patch)
  -v, --version=<value>  Version to tag build

DESCRIPTION
  create build to deploy
```

## `xcl project create [PROJECT]`

creates a project including a new directory and the configured folder structure

```
USAGE
  $ xcl project create [PROJECT] [-h] [-w <value>] [--single-schema] [-i]

ARGUMENTS
  PROJECT  name of the project to create

FLAGS
  -h, --help               Show CLI help.
  -i, --interactive        Interactive wizard that guides you through the creation of the project
  -w, --workspace=<value>  workspace name the application should be installed in
  --single-schema          one schema instead of three, no deployment user

DESCRIPTION
  creates a project including a new directory and the configured folder structure
```

## `xcl project deploy [PROJECT]`

deploy the project or build

```
USAGE
  $ xcl project deploy [PROJECT] -c <value> [-h] [-p <value>] [-d] [-s <value>] [--schema-only] [-m <value>] [-b
    <value>] [-y] [--ords-url <value>] [--schema <value>] [--quiet] [--nocompile]

ARGUMENTS
  PROJECT  Name of the project that should be deployed

FLAGS
  -b, --build=<value>       build-number to deploy
  -c, --connection=<value>  (required) [default: 192.168.99.101:1521/XEPDB1] connection string HOST:PORT/SERVICE_NAME
  -d, --dependencies        Deploy inclusive dependencies (you will be asked for sys-user password)
  -h, --help                Show CLI help.
  -m, --mode=<value>        [default: dev] mode of build (init/patch/dev)
  -p, --password=<value>    Password for Deployment User
  -s, --syspw=<value>       Provide sys-password for silent mode dependency installation [IMPORTANT: All existing users
                            will be overwritten!]
  -y, --yes                 Automatic proceed to the next schema without asking
  --nocompile               ignore invalid objects on deploy
  --ords-url=<value>        [IP/SERVERNAME]:PORT
  --quiet                   suppress output
  --schema=<value>          to deploy a single schema type one of the following: [data, logic, app]
  --schema-only             Deploys only schema objects

DESCRIPTION
  deploy the project or build
```

## `xcl project init [PROJECT]`

initializes a project

```
USAGE
  $ xcl project init [PROJECT] [-h] [-s <value>] [-c <value>] [-f] [-y] [-o] [-u]

ARGUMENTS
  PROJECT  name of the project to initialze

FLAGS
  -c, --connection=<value>  [default: 192.168.99.101:1521/XEPDB1] Connectstring ex. localhost:1521/xepdb1
  -f, --force               Attention: force will drop existing schemas
  -h, --help                Show CLI help.
  -o, --objects             Install basic objects defined in setup directory
  -s, --syspw=<value>       Password of user sys
  -u, --users               Install standard schemas APP, LOGIC, DATA, DEPL
  -y, --yes                 Answers force-action with yes (Use with caution)

DESCRIPTION
  initializes a project
```

## `xcl project list`

lists all xcl projects

```
USAGE
  $ xcl project list [-h]

FLAGS
  -h, --help  Show CLI help.

DESCRIPTION
  lists all xcl projects
```

## `xcl project plan [PROJECT]`

generate commands to bring the project up to date

```
USAGE
  $ xcl project plan [PROJECT] [-h] [--auto-apply] [--yes]

ARGUMENTS
  PROJECT  name of the project

FLAGS
  -h, --help    Show CLI help.
  --auto-apply  proceed with apply after plan
  --yes         skip all prompts with answer 'yes'

DESCRIPTION
  generate commands to bring the project up to date
```

## `xcl project remove PROJECT`

removes a project

```
USAGE
  $ xcl project remove [PROJECT] [-h] [-p] [-d] [-c <value>] [-s <value>]

ARGUMENTS
  PROJECT  name of the project to remove

FLAGS
  -c, --connection=<value>
  -d, --database
  -h, --help                Show CLI help.
  -p, --path
  -s, --syspw=<value>

DESCRIPTION
  removes a project
```

## `xcl project reset [COMMIT] [PROJECT]`

reset project to commit id or tag

```
USAGE
  $ xcl project reset [COMMIT] [PROJECT] [-h] [-y]

ARGUMENTS
  COMMIT   commit id or tag name
  PROJECT  name of the project that should be build

FLAGS
  -h, --help  Show CLI help.
  -y, --yes   proceed without confirmation

DESCRIPTION
  reset project to commit id or tag

EXAMPLES
  $ xcl project reset
```
<!-- commandsstop -->
