set serveroutput on;
set feedback off;

declare
   v_invalid_count number(10);
begin
   select count(*)
   into v_invalid_count
   from user_objects
   where status = 'INVALID';

   if v_invalid_count > 0 then
      dbms_output.put_line(v_invalid_count||' invalid objects after deploy: ');
      for object in (select  object_type, object_name
                     from user_objects
                     where status = 'INVALID'
                     order by object_type)
      loop
         dbms_output.put_line('- '||object.object_name ||' ('||object.object_type||')');
      end loop;
   else
      dbms_output.put_line('No invalid objects after deploy!');
   end if;

end;
/