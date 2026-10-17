-- Transactional acceptance check. Synthetic rows are rolled back, including auth users.
begin;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.sorachi_save_backup(0,'{"schemaVersion":2,"owner":{"kind":"account","id":"11111111-1111-4111-8111-111111111111"},"learning":{},"attempts":[]}'::jsonb);
do $$ begin
  if (select count(*) from public.sorachi_backups) <> 1 then raise exception 'Owner cannot read own backup'; end if;
  begin
    perform public.sorachi_save_backup(0,'{"schemaVersion":2,"owner":{"kind":"account","id":"11111111-1111-4111-8111-111111111111"},"learning":{},"attempts":[]}'::jsonb);
    raise exception 'Stale write was accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.sorachi_save_backup(0,'{"schemaVersion":2,"owner":{"kind":"account","id":"22222222-2222-4222-8222-222222222222"},"learning":{},"attempts":[]}'::jsonb);
    raise exception 'Spoofed owner was accepted';
  exception when invalid_parameter_value then null; end;
  begin
    delete from public.sorachi_backups;
    raise exception 'Direct deletion was accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform count(*) from public.sorachi_feedback;
    raise exception 'Feedback became public';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.sorachi_backups) <> 0 then raise exception 'Another account can read owner backup'; end if;
end $$;
reset role;
set local role anon;
select set_config('request.jwt.claims','{}',true);
do $$ begin
  begin
    perform count(*) from public.sorachi_backups;
    raise exception 'Anonymous backup read was accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.sorachi_save_backup(0,'{}'::jsonb);
    raise exception 'Anonymous backup write was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: owner isolation, stale writes, anonymous access, private feedback' as result;
rollback;
