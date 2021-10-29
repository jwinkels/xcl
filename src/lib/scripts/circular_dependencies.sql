set serveroutput on;
declare
    v_circle number(10);
begin
 for project in (select substr(username,0, instr(username,'_')-1) name
from dba_users
where username like '%_LOGIC')
loop
    for priv in (select distinct grantor
            from dba_tab_privs
            where owner != project.name||'_LOGIC'
            and grantee = project.name||'_LOGIC'
            and owner not like project.name||'%'
            and owner != 'SYS')
    loop        
    
    select count(*)
    into v_circle
    from dba_tab_privs
    where grantee = priv.grantor
    and grantor = project.name||'_LOGIC';
    
    if v_circle > 0 then
        dbms_output.put_line(project.name||'_LOGIC has circular dependency with: '||priv.grantor);
        dbms_output.put_line('Objects of '||project.name||' in ' || priv.grantor);
        for object in (select table_name, type
                            from dba_tab_privs
                            where grantee = priv.grantor
                            and grantor = project.name||'_LOGIC')
        loop
           dbms_output.put_line(object.table_name||' ('||object.type||')'); 
        end loop;
         dbms_output.put_line(chr(10));
        dbms_output.put_line('Objects of '||priv.grantor||' in ' || project.name);
        for object in (select table_name, type
                            from dba_tab_privs
                            where grantee = project.name||'_LOGIC'
                            and grantor = priv.grantor)
        loop
           dbms_output.put_line(object.table_name||' ('||object.type||')'); 
        end loop;
        dbms_output.put_line('_____________________________________');   
    end if;
    
    end loop;
    
end loop;
end;
/