-- Custom appliance photos (ApplianceBox camera + CustomApplianceModal).
--
-- Public bucket: box/list images load via plain public URLs with
-- no auth and no expiring params. Writes are per-user: every
-- object lives under <user_id>/ so users can only manage their
-- own photos. Replaced photos are deleted by the client
-- (best-effort) to avoid orphans.
--
-- Row photo reference: public.appliances.image_url (nullable).
-- Customs without one render the bundled adlawatt icon, which
-- is already the default imageSource in ApplianceBox,
-- ApplianceStatusBox, and AppRecCard. Row RLS is unchanged:
-- the existing owner insert/update/select/delete policies
-- cover the new column (whole-row policies).

insert into storage.buckets (id, name, public)
values ('appliance-images', 'appliance-images', true)
on conflict (id) do update set public = true;

-- Public read: anyone can fetch appliance photos.
drop policy if exists "Public read appliance images" on storage.objects;

create policy "Public read appliance images"
on storage.objects
for select
using (bucket_id = 'appliance-images');

-- Users upload only under their own <user_id>/ prefix.
drop policy if exists "Users upload own appliance images" on storage.objects;

create policy "Users upload own appliance images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'appliance-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users replace only their own photos.
drop policy if exists "Users update own appliance images" on storage.objects;

create policy "Users update own appliance images"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'appliance-images'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'appliance-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users delete only their own photos (photo replacement
-- removes the previous object).
drop policy if exists "Users delete own appliance images" on storage.objects;

create policy "Users delete own appliance images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'appliance-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Photo reference on the appliance row. Null = bundled
-- adlawatt icon (the existing default everywhere).
alter table public.appliances
add column if not exists image_url text;
