set define '^'
set concat on
set concat .
set verify off

grant execute on ^1 to public;
create or replace public synonym ^1 for ^1;