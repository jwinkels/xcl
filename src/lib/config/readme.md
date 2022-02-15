# XCL - Directory - Structure and Meaning

<br/>

## Folders @Root-Level

XCL knows the following directories mostly at the root level of the respective project:

| Folder          | Description
| --------------- | ---------------------------------------------------
| **apex**        | All APEX application will be stored in this folder
| **db**          | This folder contains the required database schemas and their objects.
| db/_setup       | This folder contains the required objects your application depends on. All scripts inside are called by the preferred admin account you configured (sys, admin, ...)
| **rest**        | Here the REST services / modules are stored
| **static**      | In this folder all static files are stored inside application specific subfolders (like f1000/src ). These source files are meant for js, css and images uploaded to apex, for version control reasons. They will not be uploaded during deploy process. We think of them as part of the apex sources, and therefor part of the deploy process anyhow.

>- (dependencies [In later state (when you added your first feature) the dependency directory will appear])
>- This structure is independent from the project-type. xcl knows two types: SingleSchema, MultiSchema.

<br/>
<br/>

## Schema Mode
The db folder will contain three sub-directories when you are using `MultiSchema` - Mode:

- <`Project_Name`>_app
- <`Project_Name`>_logic
- <`Project_Name`>_data

these resemble the schemata in your Oracle-DB. When you use a `SingleSchema` - Mode, you just reduce the amount of available schemas to 1.
- <`Project_Name`>_app

<br/>
<br/>

## DBSchema Configuration

Each schema folder except *_setup* is build with the same structur.


| <div style="width:150px">Folder</div>| Description
|-------------------|---------------------------------------
| db                |
| .. schema         |
| .... constraints  | Constraints are stored here and subdivided according to their type
| ...... checks     | Check Constraints
| ...... foreigns   | Foreign Keys
| ...... primaries  | Primary Keys
| ...... uniques    | Unique Keys
| .... contexts     | Sys_Contexts when needed
| .... ddl          | DDL Scripts for deployment subdivided on deployment mode
| ...... init       | Init scripts are executed only for the first installation (init).
| ...... patch      | Patch scripts are executed only in the update case (patch) and are divided into scripts that are executed at the beginning or at the end of the respective update.
| ........ post     |
| ........ pre      |
| .... dml          | DML Scripts for deployment subdivided on deployment mode
| ...... base       | Base scripts are always executed, no matter if for the first installation (init) or in case of an update (patch). Therefore they must be restartable.
| ...... init       | Init scripts are executed only for the first installation (init).
| ...... patch      | Patch scripts are executed only in the update case (patch) and are divided into scripts that are executed at the beginning or at the end of the respective update.
| ........ post     |
| ........ pre      |
| .... indexes      | Indexes are stored here and subdivided according to their type
| ...... defaults   | Non uniqe indexes
| ...... primaries  | Unique Indexes based in primary key columns
| ...... uniques    | Unique Indexes
| .... jobs         | Jobs, Scheduler scripts goes here
| .... policies     | Policies
| .... sequences    | Sequences must be scripted in a restartable manner
| .... sources      | All PL/SQL Code is stored in respective subfolders
| ...... functions  |
| ...... packages   | Extension for package specification is pks and extension pkb is used for body
| ...... procedures |
| ...... triggers   |
| ...... types      |
| .... views        | Views goes here
| .... tables       | Here are all create table scripts stored
| ...... tables_ddl | All table alter or modification scripts named with tablename.num.sql goes here
| .....tests        | Unittests
| ...... packages   | Packages containing utPLSQL Unittests


<br/>

> To make it complete: On each level of the directories there are so called `.hook` folders. You can find them in the main directory, in the db folder and in the respective schema folders. The `.hook` folders are always divided into the subfolders `pre` and `post`. During the deployment the scripts there will be executed in alphabetically order.

>**IMPORTANT**: You can interprete this directory-Structure as you like, as long as your deploy-Method can handle this.