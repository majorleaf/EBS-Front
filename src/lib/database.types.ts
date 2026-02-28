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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          event_date: string
          price: number
          category: string
          capacity: number
          available_seats: number
          image_url: string | null
          organizer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location: string
          event_date: string
          price?: number
          category: string
          capacity: number
          available_seats: number
          image_url?: string | null
          organizer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          event_date?: string
          price?: number
          category?: string
          capacity?: number
          available_seats?: number
          image_url?: string | null
          organizer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          event_id: string
          user_id: string
          num_tickets: number
          total_price: number
          status: 'confirmed' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          num_tickets: number
          total_price: number
          status?: 'confirmed' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          num_tickets?: number
          total_price?: number
          status?: 'confirmed' | 'cancelled'
          created_at?: string
        }
      }
    }
  }
}
