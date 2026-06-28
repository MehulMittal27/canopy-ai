alter table public.documents
add column if not exists updated_at timestamptz default now(),
add column if not exists uploaded_by uuid references auth.users(id) on delete set null,
add column if not exists mime_type text,
add column if not exists file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
add column if not exists s3_bucket text,
add column if not exists s3_key text,
add column if not exists file_url text,
add column if not exists upload_status text default 'uploaded'
  check (upload_status in ('pending', 'uploaded', 'failed'));

create unique index if not exists documents_s3_object_key_idx
on public.documents (s3_bucket, s3_key)
where s3_bucket is not null and s3_key is not null;

drop trigger if exists documents_touch_updated_at on public.documents;
create trigger documents_touch_updated_at
before update on public.documents
for each row
execute function public.touch_updated_at();
