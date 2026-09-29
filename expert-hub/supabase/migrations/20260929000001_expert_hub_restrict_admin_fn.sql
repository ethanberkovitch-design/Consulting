-- is_expert_admin() is only needed inside RLS policies for signed-in users;
-- anonymous visitors should not be able to call it through the REST API.
revoke execute on function public.is_expert_admin() from public, anon;
grant execute on function public.is_expert_admin() to authenticated;
