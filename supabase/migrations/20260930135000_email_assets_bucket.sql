-- Public bucket for email assets (alert-email header logo).
--
-- The alert-email HTML references a hosted copy of
-- assets/images/adlawatt-logo.png via EXPO_PUBLIC_AGENTMAIL_LOGO_URL.
-- Gmail fetches images through its own proxy, so the object must be
-- publicly readable with no auth and no expiring params.

insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do update set public = true;

-- Public read: anyone (incl. Gmail's image proxy) can fetch objects.
drop policy if exists "Public read email assets" on storage.objects;

create policy "Public read email assets"
on storage.objects
for select
using (bucket_id = 'email-assets');

-- Authenticated upload/replace for future logo refreshes.
drop policy if exists "Authenticated write email assets" on storage.objects;

create policy "Authenticated write email assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'email-assets');

drop policy if exists "Authenticated update email assets" on storage.objects;

create policy "Authenticated update email assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'email-assets')
with check (bucket_id = 'email-assets');

drop policy if exists "Authenticated delete email assets" on storage.objects;

create policy "Authenticated delete email assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'email-assets');
