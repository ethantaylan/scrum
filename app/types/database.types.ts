export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          name: string
          is_revealed: boolean
          creator_id: string | null
          deck_type: 'fibonacci' | 'tshirt' | 'hours'
          password: string | null
          auto_reveal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          is_revealed?: boolean
          creator_id?: string | null
          deck_type?: 'fibonacci' | 'tshirt' | 'hours'
          password?: string | null
          auto_reveal?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_revealed?: boolean
          creator_id?: string | null
          deck_type?: 'fibonacci' | 'tshirt' | 'hours'
          password?: string | null
          auto_reveal?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          nickname: string
          vote: string | null
          has_voted: boolean
          is_online: boolean
          is_spectator: boolean
          avatar: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          nickname: string
          vote?: string | null
          has_voted?: boolean
          is_online?: boolean
          is_spectator?: boolean
          avatar?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          nickname?: string
          vote?: string | null
          has_voted?: boolean
          is_online?: boolean
          is_spectator?: boolean
          avatar?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
