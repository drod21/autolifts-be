ALTER TABLE "users" ADD COLUMN "supabase_auth_uid" uuid DEFAULT gen_random_uuid();