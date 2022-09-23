set define '^'
set concat on
set concat .
set verify off
set termout on
set serveroutput on;

DECLARE
    v_workspace_exists number(1);
    v_schema_list varchar2(4000);
    v_workspace_id number;
BEGIN

    if '^3' = 'null' or ^3 is null then
        v_workspace_id := null;
    else
        v_workspace_id := to_number('^3');
    end if;

    select count(*)
    into v_workspace_exists
    from apex_workspaces
    where workspace_id = v_workspace_id;

    dbms_output.put_line('create workspace ^1 and primary_schema ^2');

    if v_workspace_exists = 0 then
        APEX_INSTANCE_ADMIN.ADD_WORKSPACE (
            p_workspace          => '^1',
            p_primary_schema     => '^2',
            p_workspace_id       => v_workspace_id,
            p_additional_schemas => '');
        dbms_output.put_line('created');
    else
        v_schema_list := APEX_INSTANCE_ADMIN.GET_SCHEMAS(upper('^1'));
         dbms_output.put_line('Schemata in WORKSPACE (^1): '||v_schema_list);
        if instr(v_schema_list, upper('^2')) = 0 then
            
            APEX_INSTANCE_ADMIN.ADD_SCHEMA(
                        p_workspace => '^1',
                        p_schema    => '^2');
            dbms_output.put_line('Added Schema (^2) to WORKSPACE...');
        ELSE
            dbms_output.put_line('Schema ^2 already attached to ^1: '||v_schema_list);
        end if;
    end if;
    commit;
END;
/