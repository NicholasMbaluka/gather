export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          bio: string | null
          interests: string[] | null
          is_premium: boolean
          premium_expires_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          interests?: string[] | null
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          interests?: string[] | null
          is_premium?: boolean
          premium_expires_at?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          location: string
          date: string
          category: string
          image_url: string | null
          created_by: string
          featured: boolean
          max_attendees: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          location: string
          date: string
          category: string
          image_url?: string | null
          created_by: string
          featured?: boolean
          max_attendees?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          location?: string
          date?: string
          category?: string
          image_url?: string | null
          created_by?: string
          featured?: boolean
          max_attendees?: number | null
          created_at?: string
        }
      }
      event_attendees: {
        Row: {
          id: string
          user_id: string
          event_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          joined_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          event_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      connections: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          from_user: string
          to_user: string
          event_id: string
          rating: number
          created_at: string
        }
        Insert: {
          id?: string
          from_user: string
          to_user: string
          event_id: string
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          from_user?: string
          to_user?: string
          event_id?: string
          rating?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'premium_monthly' | 'premium_quarterly' | 'featured_event'
          status: 'pending' | 'completed' | 'failed'
          reference: string | null
          event_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'premium_monthly' | 'premium_quarterly' | 'featured_event'
          status?: 'pending' | 'completed' | 'failed'
          reference?: string | null
          event_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'premium_monthly' | 'premium_quarterly' | 'featured_event'
          status?: 'pending' | 'completed' | 'failed'
          reference?: string | null
          event_id?: string | null
          created_at?: string
        }
      }
      profile_views: {
        Row: {
          id: string
          viewer_id: string
          profile_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          viewer_id: string
          profile_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          viewer_id?: string
          profile_id?: string
          viewed_at?: string
        }
      }
    }
  }
}
