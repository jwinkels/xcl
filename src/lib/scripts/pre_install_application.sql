set define '^'
set concat on
set concat .
set verify off
set termout on

set serveroutput on
declare
	v_workspace_id	apex_workspaces.workspace_id%type;
  ords_url  varchar2(100);
begin
  select workspace_id
    into v_workspace_id
    from apex_workspaces
   where upper(workspace) = upper('^1');

  apex_application_install.set_workspace_id(v_workspace_id);    
  apex_application_install.set_application_id(^2);
  apex_application_install.generate_offset;
  apex_application_install.set_schema('^3');

  ords_url:='^4';

  begin
    if ords_url is not null and trunc(lower(ords_url)) != 'undefined' then
      
      if substr(ords_url,-1,1) != '/' then
      
        ords_url:=ords_url||'/';
      
      end if;
      dbms_output.put_line('Set Remote Server: '||ords_url);
      apex_application_install.set_remote_server(upper('^5'), ords_url);
    ELSE
      dbms_output.put_line('Remote Server will not be set!!');
    end if;
  exception when others then
    dbms_output.put_line('Unexpected Error: '||sqlerrm);
  end;

end;
/

@@install.sql

exit