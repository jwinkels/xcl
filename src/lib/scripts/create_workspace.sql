set define '^'
set concat on
set concat .
set verify off
set termout on
set serveroutput on;

DECLARE
    v_workspace_exists number(1);
BEGIN
    select count(*)
    into v_workspace_exists
    from apex_workspaces
    where workspace = '^1';

    dbms_output.put_line('create workspace ^1 and primary_schema ^2');

    if v_workspace_exists = 0 then
    /*    APEX_INSTANCE_ADMIN.ADD_WORKSPACE (
            p_workspace          => '^1',
            p_primary_schema     => '^2',
            p_additional_schemas => '');
            */
    dbms_output.put_line('created');
    end if;
END;
/