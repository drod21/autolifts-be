export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auto_regulation_settings: {
        Row: {
          created_at: string | null
          id: string
          parameters: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          parameters?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          parameters?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_system_exercise: boolean | null
          movement_type_id: number | null
          muscle_group_id: number | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_system_exercise?: boolean | null
          movement_type_id?: number | null
          muscle_group_id?: number | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_system_exercise?: boolean | null
          movement_type_id?: number | null
          muscle_group_id?: number | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'exercises_movement_type_id_fkey'
            columns: ['movement_type_id']
            isOneToOne: false
            referencedRelation: 'movement_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'exercises_muscle_group_id_fkey'
            columns: ['muscle_group_id']
            isOneToOne: false
            referencedRelation: 'muscle_groups'
            referencedColumns: ['id']
          },
        ]
      }
      movement_types: {
        Row: { id: number; name: string }
        Insert: { id?: number; name: string }
        Update: { id?: number; name?: string }
        Relationships: []
      }
      muscle_groups: {
        Row: { id: number; name: string }
        Insert: { id?: number; name: string }
        Update: { id?: number; name?: string }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_id: string | null
          experience_level: string | null
          goal: string | null
          height: number | null
          id: number
          starting_day: string | null
          user_id: string
          weight: number | null
          workouts_per_week: number | null
        }
        Insert: {
          auth_id?: string | null
          experience_level?: string | null
          goal?: string | null
          height?: number | null
          id?: number
          starting_day?: string | null
          user_id: string
          weight?: number | null
          workouts_per_week?: number | null
        }
        Update: {
          auth_id?: string | null
          experience_level?: string | null
          goal?: string | null
          height?: number | null
          id?: number
          starting_day?: string | null
          user_id?: string
          weight?: number | null
          workouts_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_user_id_fkey1'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      program_workouts: {
        Row: {
          created_at: string | null
          day: number | null
          id: string
          is_deload: boolean | null
          program_id: string | null
          scheduled_date: string | null
          updated_at: string | null
          week_number: number
          workout_id: string | null
        }
        Insert: {
          created_at?: string | null
          day?: number | null
          id?: string
          is_deload?: boolean | null
          program_id?: string | null
          scheduled_date?: string | null
          updated_at?: string | null
          week_number: number
          workout_id?: string | null
        }
        Update: {
          created_at?: string | null
          day?: number | null
          id?: string
          is_deload?: boolean | null
          program_id?: string | null
          scheduled_date?: string | null
          updated_at?: string | null
          week_number?: number
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'program_workouts_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'program_workouts_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'workouts'
            referencedColumns: ['id']
          },
        ]
      }
      programs: {
        Row: {
          created_at: string | null
          duration_weeks: number
          end_date: string
          has_deload_week: boolean | null
          id: string
          name: string
          start_date: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_weeks?: number
          end_date: string
          has_deload_week?: boolean | null
          id?: string
          name: string
          start_date: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_weeks?: number
          end_date?: string
          has_deload_week?: boolean | null
          id?: string
          name?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_sets: {
        Row: {
          actual_reps: number | null
          created_at: string | null
          exercise_id: string
          id: string
          is_complete: boolean | null
          planned_reps: number | null
          rpe: number | null
          session_id: string | null
          set_number: number
          updated_at: string | null
          weight: number | null
          workout_exercise_id: string
        }
        Insert: {
          actual_reps?: number | null
          created_at?: string | null
          exercise_id: string
          id?: string
          is_complete?: boolean | null
          planned_reps?: number | null
          rpe?: number | null
          session_id?: string | null
          set_number: number
          updated_at?: string | null
          weight?: number | null
          workout_exercise_id: string
        }
        Update: {
          actual_reps?: number | null
          created_at?: string | null
          exercise_id?: string
          id?: string
          is_complete?: boolean | null
          planned_reps?: number | null
          rpe?: number | null
          session_id?: string | null
          set_number?: number
          updated_at?: string | null
          weight?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'session_sets_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'session_sets_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'workout_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'session_sets_workout_exercise_id_fkey'
            columns: ['workout_exercise_id']
            isOneToOne: false
            referencedRelation: 'workout_exercises'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          auth_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          rep_max: number | null
          rep_min: number | null
          rest_timer: number | null
          sets: number
          total_reps: number | null
          updated_at: string | null
          weight: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          rep_max?: number | null
          rep_min?: number | null
          rest_timer?: number | null
          sets: number
          total_reps?: number | null
          updated_at?: string | null
          weight?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          rep_max?: number | null
          rep_min?: number | null
          rest_timer?: number | null
          sets?: number
          total_reps?: number | null
          updated_at?: string | null
          weight?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'workouts'
            referencedColumns: ['id']
          },
        ]
      }
      workout_sessions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          created_at: string | null
          duration: unknown | null
          id: string
          program_id: string | null
          scheduled_date: string | null
          updated_at: string | null
          user_id: string | null
          workout_id: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string | null
          duration?: unknown | null
          id?: string
          program_id?: string | null
          scheduled_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          created_at?: string | null
          duration?: unknown | null
          id?: string
          program_id?: string | null
          scheduled_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'workout_sessions_program_id_fkey'
            columns: ['program_id']
            isOneToOne: false
            referencedRelation: 'programs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_sessions_workout_id_fkey'
            columns: ['workout_id']
            isOneToOne: false
            referencedRelation: 'workouts'
            referencedColumns: ['id']
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
