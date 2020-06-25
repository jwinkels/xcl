# XCL - Directory - Structure and Meaning
At the highest level you will find 3 directories:

    - apex
    - apex_files
    - db
    - (dependencies [In later state (when you added your first feature) the dependency directory will appear])


## apex
the apex directory contains the splitted or unsplitted apex sources


## apex_files
this directory is oirganized in subdirectories as follows:

    - css
    - img
    - js

these contains, the source files for js or css and images uploaded to apex, for version control reasons.
They will not be uploaded during deploy process. We think of them as part of the apex sources, and therefor part of the deploy process anyhow.



## db
The db folder will contain three sub-directories:
    - <Project_Name>_app
    - <Project_Name>_logic
    - <Project_Name>_data

these resemble the schemata in your Oracle-DB which were obligatory for every xcl-managed project.



#### <Project_Name>_app - directory && <Project_Name>_logic
The directory of these two directories are equal:
The following table will give you an overview of the directories and whats the idea behind this. 

IMPORTANT: You can interprete this directory-Structure as you like, as long as your deploy-Method can handle this.

|Directory  | Sub-Directory| execution-type|
|-----------|--------------|---------------|
|init       | ddl          | One-Timer     |
|init       | dml          | One-Timer     |
|pre        | ddl          | Always        |
|pre        | dml          | Always        |
|sources    | functions    | Always        |
|sources    | objects      | Always        |
|sources    | packages     | Always        |
|sources    | procedures   | Always        |
|sources    | tests        | Always        |
|sources    | trigger      | Always        |
|sources    | views        | Always        |
|precompile |              | Always        |
|post       | ddl          | One-Timer     |
|post       | dml          | One-Timer     |
|finally    |              | Always        |




### <Project_Name>_data - directory
It differs from the <Project_Name>_logic and app directory by the following:


|Directory  | Sub-Directory| execution-type| Additional info         |
|-----------|--------------|---------------|-------------------------|
|tables     |              | Always        |                         |
|tables_ddl |              | Always        | not used in orcas4xcl   |
|sequences  |              | Always        |                         |

The sql-files in this directories will be executed after pre-files and before sources.