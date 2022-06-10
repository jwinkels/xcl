set define '^'
set concat on
set concat .
set verify off
set termout on

exec dbms_utility.compile_schema(schema => '^1', compile_all => true);