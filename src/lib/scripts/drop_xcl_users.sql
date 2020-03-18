set define '^'
set concat on
set concat .
set verify off
set echo off
set termout on

define _data_schema =^1
define _logic_schema =^2
define _app_schema =^3
define _depl_user =^4

@@drop_user.sql ^_depl_user
@@drop_user.sql ^_data_schema
@@drop_user.sql ^_logic_schema
@@drop_user.sql ^_app_schema
