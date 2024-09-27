import { Context, Elysia } from 'elysia'
import { createClient } from '@supabase/supabase-js'

export const authMiddleware = async ({ request: { headers } }: Context) => {
  const supabaseUrl = 'https://vmjkjofwsadfuoujiwal.supabase.co'
  const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtamtqb2Z3c2FkZnVvdWppd2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTcyMzkxMiwiZXhwIjoyMDQxMjk5OTEyfQ.ERmiyte3wdmNWtE7GizuddYKcatVHNCc-31BRZwksDo'

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const auth = headers.get('Authorization')
  if (!auth) {
    return false
  }

  const token = auth.replace('Bearer ', '')
  console.log('aaa', token)
  const { data: user, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return false
  }
  return user
}
