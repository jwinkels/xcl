set define '^'
set concat on
set concat .
set verify off
set termout on

set serveroutput on
declare
	v_workspace_id	apex_workspaces.workspace_id%type;
begin
  select workspace_id
    into v_workspace_id
    from apex_workspaces
   where workspace = '^1';

  apex_application_install.set_workspace_id(v_workspace_id);    
  apex_application_install.set_application_id(^2);
  apex_application_install.generate_offset;
  apex_application_install.set_schema('^3');
end;
/

@@install.sql

exit