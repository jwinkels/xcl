set define '^'
set concat on
set concat .
set verify off
set echo off
set termout on

prompt creating user ^1 (schema-only)
create user ^1 NO AUTHENTICATION
  default tablespace users
  temporary tablespace temp
  profile default
  account unlock;

set termout off

-- 2 tablespace quotas for ^1
--alter user ^1 quota unlimited on indx;
alter user ^1 quota unlimited on users;

-- 2 roles for ^1
--grant imp_full_database to ^1;
alter user ^1 default role all;

-- 11 system privileges for ^1
grant create any context to ^1;
grant create any directory to ^1;
grant create any procedure to ^1;

grant create job to ^1;
grant create procedure to ^1;
grant create sequence to ^1;
grant create synonym to ^1;
grant create public synonym to ^1;
grant create table to ^1;
grant create trigger to ^1;
grant create type to ^1;
grant create view to ^1;
grant create session to ^1;

-- 5 object privileges for ^1
grant read, write on directory datapump_dir to ^1;

grant execute on sys.dbms_crypto to ^1;
grant execute on sys.utl_file to ^1;
grant execute on sys.utl_http to ^1;
