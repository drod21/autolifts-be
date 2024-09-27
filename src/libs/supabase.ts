import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vmjkjofwsadfuoujiwal.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtamtqb2Z3c2FkZnVvdWppd2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTcyMzkxMiwiZXhwIjoyMDQxMjk5OTEyfQ.ERmiyte3wdmNWtE7GizuddYKcatVHNCc-31BRZwksDo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
