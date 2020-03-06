prompt &1 anlegen

create user &1 identified by &2
default tablespace users
temporary tablespace temp
profile default
account unlock;

prompt Tablespace Quotas für &1
alter user &1 quota unlimited on users;

prompt Privileges für &1
grant create procedure to &1;
grant create sequence to &1;
grant create session to &1;
grant create synonym to &1;
grant create table to &1;
grant create trigger to &1;
grant create type to &1;
grant create view to &1;
grant create job to &1;

grant create any context to &1;
grant execute on sys.dbms_crypto to &1;

grant connect to &1;