prompt &1 anlegen
create user &1
  identified by &2
  default tablespace users
  temporary tablespace temp
  profile default
  account unlock;

prompt Privileges für &1
grant connect to &1;
grant create any context to &1;

prompt Roles für &1
alter user &1 default role all;
