export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string
          role?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          event_date: string
          location: string
          capacity: number
          available_seats: number
          price: number
          category: string
          organizer_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          event_date: string
          location: string
          capacity: number
          available_seats?: number
          price: number
          category?: string
          organizer_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          event_date?: string
          location?: string
          capacity?: number
          available_seats?: number
          price?: number
          category?: string
          organizer_id?: string
          status?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          event_id: string
          num_tickets: number
          total_price: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          num_tickets: number
          total_price: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          num_tickets?: number
          total_price?: number
          status?: string
          updated_at?: string
        }
      }
    }
  }
}