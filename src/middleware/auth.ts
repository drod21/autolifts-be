import { Context, Elysia } from 'elysia'
import { createClient, User } from '@supabase/supabase-js'

export const authMiddleware = async (bearer: string): Promise<User | false> => {
  const supabaseUrl = 'https://vmjkjofwsadfuoujiwal.supabase.co'
  const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtamtqb2Z3c2FkZnVvdWppd2FsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTcyMzkxMiwiZXhwIjoyMDQxMjk5OTEyfQ.ERmiyte3wdmNWtE7GizuddYKcatVHNCc-31BRZwksDo'

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  if (!bearer) {
    return false
  }

  const token = bearer.replace('Bearer ', '')
  const { data: user, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return false
  }
  return user.user
}
