set define '^'
set concat on
set concat .
set verify off

define _depl_user =^1
define _depl_password =^2
define _data_schema =^3
define _logic_schema =^4
define _app_schema =^5

column script_name NEW_VALUE v_script_name
set termout off --hide this from the user
select case to_number(substr(version, 1, instr(version, '.', 1, 1)-1)) 
        when 11 then 
          'create_schema_user_11.sql'
        else
          'create_schema_user.sql'
       end script_name
  from product_component_version
 where product like 'Oracle Database %';
set termout on

@@^v_script_name ^_data_schema
@@^v_script_name ^_logic_schema
@@^v_script_name ^_app_schema

@@create_depl_user.sql ^_depl_user ^_depl_password ^_data_schema ^_logic_schema ^_app_schema
