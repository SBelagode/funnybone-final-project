export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      allowed_signup_domains: {
        Row: {
          apex_domain: string
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          apex_domain: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          apex_domain?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "allowed_signup_domains_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allowed_signup_domains_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          message: string | null
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string | null
          subject: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          message?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          subject?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          message?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_examples: {
        Row: {
          caption: string
          created_by_user_id: string
          created_datetime_utc: string
          explanation: string
          id: number
          image_description: string
          image_id: string | null
          modified_by_user_id: string
          modified_datetime_utc: string
          priority: number
        }
        Insert: {
          caption: string
          created_by_user_id?: string
          created_datetime_utc?: string
          explanation: string
          id?: number
          image_description: string
          image_id?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number
        }
        Update: {
          caption?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          explanation?: string
          id?: number
          image_description?: string
          image_id?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "caption_examples_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_examples_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_examples_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_requests: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          image_id: string
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id?: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caption_requests_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_requests_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_requests_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_saves: {
        Row: {
          caption_id: string
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
        }
        Insert: {
          caption_id: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
        }
        Update: {
          caption_id?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "caption_saved_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_saved_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "caption_saved_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_saved_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_saved_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      caption_votes: {
        Row: {
          caption_id: string
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          is_from_study: boolean
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
          vote_value: number
        }
        Insert: {
          caption_id: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          is_from_study?: boolean
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
          vote_value: number
        }
        Update: {
          caption_id?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          is_from_study?: boolean
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
          vote_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "caption_votes_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_votes_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "caption_votes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_votes_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caption_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      captions: {
        Row: {
          caption_request_id: number | null
          content: string | null
          created_by_user_id: string
          created_datetime_utc: string
          humor_flavor_id: number | null
          id: string
          image_id: string
          is_featured: boolean
          is_public: boolean
          like_count: number
          llm_prompt_chain_id: number | null
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
        }
        Insert: {
          caption_request_id?: number | null
          content?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id?: number | null
          id?: string
          image_id: string
          is_featured?: boolean
          is_public: boolean
          like_count?: number
          llm_prompt_chain_id?: number | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
        }
        Update: {
          caption_request_id?: number | null
          content?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id?: number | null
          id?: string
          image_id?: string
          is_featured?: boolean
          is_public?: boolean
          like_count?: number
          llm_prompt_chain_id?: number | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "captions_caption_request_id_fkey"
            columns: ["caption_request_id"]
            isOneToOne: false
            referencedRelation: "caption_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_humor_flavor_id_fkey"
            columns: ["humor_flavor_id"]
            isOneToOne: false
            referencedRelation: "humor_flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_llm_prompt_chain_id_fkey"
            columns: ["llm_prompt_chain_id"]
            isOneToOne: false
            referencedRelation: "llm_prompt_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      common_use_categories: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "common_use_categories_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_use_categories_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      common_use_category_image_mappings: {
        Row: {
          common_use_category_id: number | null
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          image_id: string | null
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          common_use_category_id?: number | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          common_use_category_id?: number | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "common_use_category_image_mappings_common_use_category_id_fkey"
            columns: ["common_use_category_id"]
            isOneToOne: false
            referencedRelation: "common_use_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_use_category_image_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_use_category_image_mappings_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "common_use_category_image_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_context_tag_mappings: {
        Row: {
          community_context_id: number
          community_context_tag_id: number
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          community_context_id: number
          community_context_tag_id: number
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          community_context_id?: number
          community_context_tag_id?: number
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_context_tag_mappings_community_context_id_fkey"
            columns: ["community_context_id"]
            isOneToOne: false
            referencedRelation: "community_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_context_tag_mappings_community_context_tag_id_fkey"
            columns: ["community_context_tag_id"]
            isOneToOne: false
            referencedRelation: "community_context_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_context_tag_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_context_tag_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_context_tags: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_context_tags_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_context_tags_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_contexts: {
        Row: {
          community_id: number | null
          content: string | null
          created_by_user_id: string
          created_datetime_utc: string
          embedding: string | null
          end_datetime_utc: string | null
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          priority: number | null
          start_datetime_utc: string | null
        }
        Insert: {
          community_id?: number | null
          content?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          embedding?: string | null
          end_datetime_utc?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number | null
          start_datetime_utc?: string | null
        }
        Update: {
          community_id?: number | null
          content?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          embedding?: string | null
          end_datetime_utc?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number | null
          start_datetime_utc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_contexts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_contexts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_contexts_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dorms: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          created_datetime_utc: string
          full_name: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          short_name: string
          university_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          full_name: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          short_name: string
          university_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          full_name?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          short_name?: string
          university_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dorms_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorms_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorms_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      humor_flavor_mix: {
        Row: {
          caption_count: number
          created_by_user_id: string
          created_datetime_utc: string
          humor_flavor_id: number
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          caption_count: number
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id: number
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          caption_count?: number
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id?: number
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "humor_flavor_mix_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_mix_humor_flavor_id_fkey"
            columns: ["humor_flavor_id"]
            isOneToOne: false
            referencedRelation: "humor_flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_mix_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      humor_flavor_step_types: {
        Row: {
          created_at: string
          created_by_user_id: string
          created_datetime_utc: string
          description: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          slug: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          description: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "humor_flavor_step_types_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_step_types_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      humor_flavor_steps: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string | null
          humor_flavor_id: number
          humor_flavor_step_type_id: number
          id: number
          llm_input_type_id: number
          llm_model_id: number
          llm_output_type_id: number
          llm_system_prompt: string | null
          llm_temperature: number | null
          llm_user_prompt: string | null
          modified_by_user_id: string
          modified_datetime_utc: string
          order_by: number
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          humor_flavor_id: number
          humor_flavor_step_type_id: number
          id?: number
          llm_input_type_id: number
          llm_model_id: number
          llm_output_type_id: number
          llm_system_prompt?: string | null
          llm_temperature?: number | null
          llm_user_prompt?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          order_by: number
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          humor_flavor_id?: number
          humor_flavor_step_type_id?: number
          id?: number
          llm_input_type_id?: number
          llm_model_id?: number
          llm_output_type_id?: number
          llm_system_prompt?: string | null
          llm_temperature?: number | null
          llm_user_prompt?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          order_by?: number
        }
        Relationships: [
          {
            foreignKeyName: "humor_flavor_steps_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_steps_humor_flavor_id_fkey"
            columns: ["humor_flavor_id"]
            isOneToOne: false
            referencedRelation: "humor_flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_steps_humor_flavor_step_id_fkey"
            columns: ["humor_flavor_step_type_id"]
            isOneToOne: false
            referencedRelation: "humor_flavor_step_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_steps_llm_input_type_id_fkey"
            columns: ["llm_input_type_id"]
            isOneToOne: false
            referencedRelation: "llm_input_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_steps_llm_model_id_fkey"
            columns: ["llm_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_steps_llm_output_type_id_fkey"
            columns: ["llm_output_type_id"]
            isOneToOne: false
            referencedRelation: "llm_output_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_steps_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      humor_flavor_theme_mappings: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          humor_flavor_id: number | null
          humor_theme_id: number | null
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id?: number | null
          humor_theme_id?: number | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id?: number | null
          humor_theme_id?: number | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "humor_flavor_theme_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_theme_mappings_humor_flavor_id_fkey"
            columns: ["humor_flavor_id"]
            isOneToOne: false
            referencedRelation: "humor_flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_theme_mappings_humor_theme_id_fkey"
            columns: ["humor_theme_id"]
            isOneToOne: false
            referencedRelation: "humor_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavor_theme_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      humor_flavors: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string | null
          id: number
          is_pinned: boolean
          modified_by_user_id: string
          modified_datetime_utc: string
          slug: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          id?: number
          is_pinned?: boolean
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          id?: number
          is_pinned?: boolean
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "humor_flavors_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_flavors_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      humor_themes: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string | null
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "humor_themes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "humor_themes_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      images: {
        Row: {
          additional_context: string | null
          celebrity_recognition: string | null
          created_by_user_id: string
          created_datetime_utc: string
          embedding: string | null
          id: string
          image_description: string | null
          is_common_use: boolean | null
          is_public: boolean | null
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string | null
          url: string | null
        }
        Insert: {
          additional_context?: string | null
          celebrity_recognition?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          embedding?: string | null
          id?: string
          image_description?: string | null
          is_common_use?: boolean | null
          is_public?: boolean | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          url?: string | null
        }
        Update: {
          additional_context?: string | null
          celebrity_recognition?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          embedding?: string | null
          id?: string
          image_description?: string | null
          is_common_use?: boolean | null
          is_public?: boolean | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "images_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          expires_datetime_utc: string | null
          id: number
          invitation_token: string
          invitee_email: string
          inviter_id: string | null
          is_accepted: boolean | null
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          expires_datetime_utc?: string | null
          id?: number
          invitation_token: string
          invitee_email: string
          inviter_id?: string | null
          is_accepted?: boolean | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          expires_datetime_utc?: string | null
          id?: number
          invitation_token?: string
          invitee_email?: string
          inviter_id?: string | null
          is_accepted?: boolean | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lexicon_clusters: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      link_redirects: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          destination_url: string
          folder_path: string | null
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
          slug: string
          visit_count: number
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          destination_url: string
          folder_path?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
          slug: string
          visit_count?: number
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          destination_url?: string
          folder_path?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
          slug?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "link_redirects_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_redirects_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_input_types: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          slug: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_input_types_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_input_types_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_model_responses: {
        Row: {
          caption_request_id: number
          created_by_user_id: string
          created_datetime_utc: string
          humor_flavor_id: number
          humor_flavor_step_id: number | null
          id: string
          llm_model_id: number
          llm_model_response: string | null
          llm_prompt_chain_id: number | null
          llm_system_prompt: string
          llm_temperature: number | null
          llm_user_prompt: string
          modified_by_user_id: string
          modified_datetime_utc: string
          processing_time_seconds: number
          profile_id: string
        }
        Insert: {
          caption_request_id: number
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id: number
          humor_flavor_step_id?: number | null
          id?: string
          llm_model_id: number
          llm_model_response?: string | null
          llm_prompt_chain_id?: number | null
          llm_system_prompt: string
          llm_temperature?: number | null
          llm_user_prompt: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          processing_time_seconds: number
          profile_id: string
        }
        Update: {
          caption_request_id?: number
          created_by_user_id?: string
          created_datetime_utc?: string
          humor_flavor_id?: number
          humor_flavor_step_id?: number | null
          id?: string
          llm_model_id?: number
          llm_model_response?: string | null
          llm_prompt_chain_id?: number | null
          llm_system_prompt?: string
          llm_temperature?: number | null
          llm_user_prompt?: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          processing_time_seconds?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_model_responses_caption_request_id_fkey"
            columns: ["caption_request_id"]
            isOneToOne: false
            referencedRelation: "caption_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_humor_flavor_id_fkey"
            columns: ["humor_flavor_id"]
            isOneToOne: false
            referencedRelation: "humor_flavors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_humor_flavor_step_id_fkey"
            columns: ["humor_flavor_step_id"]
            isOneToOne: false
            referencedRelation: "humor_flavor_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_llm_model_id_fkey"
            columns: ["llm_model_id"]
            isOneToOne: false
            referencedRelation: "llm_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_llm_prompt_chain_id_fkey"
            columns: ["llm_prompt_chain_id"]
            isOneToOne: false
            referencedRelation: "llm_prompt_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_model_responses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_models: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          is_temperature_supported: boolean
          llm_provider_id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
          provider_model_id: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          is_temperature_supported?: boolean
          llm_provider_id: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
          provider_model_id: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          is_temperature_supported?: boolean
          llm_provider_id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
          provider_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_models_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_models_llm_provider_id_fkey"
            columns: ["llm_provider_id"]
            isOneToOne: false
            referencedRelation: "llm_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_models_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_output_types: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          slug: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_output_types_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_output_types_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_prompt_chains: {
        Row: {
          caption_request_id: number
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          caption_request_id: number
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          caption_request_id?: number
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_prompt_chains_caption_request_id_fkey"
            columns: ["caption_request_id"]
            isOneToOne: false
            referencedRelation: "caption_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_prompt_chains_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_prompt_chains_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_providers: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_providers_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "llm_providers_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_entities: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          entity: string
          entity_type: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          news_id: number | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          entity: string
          entity_type: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          news_id?: number | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          entity?: string
          entity_type?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          news_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "news_entities_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_entities_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_entities_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_snippets"
            referencedColumns: ["id"]
          },
        ]
      }
      news_snippets: {
        Row: {
          category: string
          created_at: string | null
          created_by_user_id: string
          created_datetime_utc: string
          headline: string
          id: number
          is_active: boolean | null
          modified_by_user_id: string
          modified_datetime_utc: string
          priority: number | null
          source_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          headline: string
          id?: number
          is_active?: boolean | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number | null
          source_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          headline?: string
          id?: number
          is_active?: boolean | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_snippets_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_snippets_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personalities: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "personalities_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalities_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_dorm_mappings: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          created_datetime_utc: string
          dorm_id: number
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          dorm_id: number
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          dorm_id?: number
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_dorm_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_dorm_mappings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_dorm_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_dorm_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_university_major_mappings: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: string
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
          university_major_id: number | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
          university_major_id?: number | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
          university_major_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_university_major_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_university_major_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_university_major_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_university_major_mappings_university_major_id_fkey"
            columns: ["university_major_id"]
            isOneToOne: false
            referencedRelation: "university_major_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_university_mappings: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string
          university_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id: string
          university_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string
          university_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_university_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_university_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_university_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_university_mappings_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          email: string | null
          first_name: string | null
          id: string
          is_in_study: boolean
          is_matrix_admin: boolean
          is_superadmin: boolean
          last_name: string | null
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_in_study?: boolean
          is_matrix_admin?: boolean
          is_superadmin?: boolean
          last_name?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_in_study?: boolean
          is_matrix_admin?: boolean
          is_superadmin?: boolean
          last_name?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_captions: {
        Row: {
          caption_id: string | null
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string | null
          reason: string | null
        }
        Insert: {
          caption_id?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          reason?: string | null
        }
        Update: {
          caption_id?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reported_captions_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_captions_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "reported_captions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_captions_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_captions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_images: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          image_id: string | null
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string | null
          reason: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          reason?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id?: string | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reported_images_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_images_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_images_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reported_images_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      screenshots: {
        Row: {
          caption_id: string | null
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string | null
        }
        Insert: {
          caption_id?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
        }
        Update: {
          caption_id?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "screenshots_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshots_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "screenshots_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshots_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screenshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_to_destinations: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_to_destinations_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_to_destinations_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          caption_id: string | null
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          profile_id: string | null
          proper_destination: string | null
          share_to_destination_id: number | null
        }
        Insert: {
          caption_id?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          proper_destination?: string | null
          share_to_destination_id?: number | null
        }
        Update: {
          caption_id?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          profile_id?: string | null
          proper_destination?: string | null
          share_to_destination_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shares_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "shares_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_share_to_destination_id_fkey"
            columns: ["share_to_destination_id"]
            isOneToOne: false
            referencedRelation: "share_to_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      sidechat_posts: {
        Row: {
          content: string | null
          created_by_user_id: string
          created_datetime_utc: string
          id: string
          like_count: number
          modified_by_user_id: string
          modified_datetime_utc: string
          post_datetime_utc: string
        }
        Insert: {
          content?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id: string
          like_count?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          post_datetime_utc: string
        }
        Update: {
          content?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: string
          like_count?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          post_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidechat_posts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidechat_posts_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studies: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string | null
          end_datetime_utc: string | null
          id: number
          is_hidden: boolean
          modified_by_user_id: string
          modified_datetime_utc: string
          slug: string | null
          start_datetime_utc: string | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          end_datetime_utc?: string | null
          id?: number
          is_hidden?: boolean
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string | null
          start_datetime_utc?: string | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          end_datetime_utc?: string | null
          id?: number
          is_hidden?: boolean
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string | null
          start_datetime_utc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studies_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studies_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_caption_mappings: {
        Row: {
          caption_id: string
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          study_id: number
        }
        Insert: {
          caption_id: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          study_id: number
        }
        Update: {
          caption_id?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          study_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_caption_mappings_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_caption_mappings_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "study_caption_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_caption_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_caption_mappings_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies"
            referencedColumns: ["id"]
          },
        ]
      }
      study_caption_vote_events: {
        Row: {
          caption_id: string
          client_event_id: string
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          input_method: Database["public"]["Enums"]["study_vote_input_method"]
          profile_id: string
          session_id: string | null
          study_caption_mapping_id: number | null
          time_to_vote_ms: number | null
          vote_value: Database["public"]["Enums"]["study_vote_value"]
        }
        Insert: {
          caption_id: string
          client_event_id: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          input_method: Database["public"]["Enums"]["study_vote_input_method"]
          profile_id: string
          session_id?: string | null
          study_caption_mapping_id?: number | null
          time_to_vote_ms?: number | null
          vote_value: Database["public"]["Enums"]["study_vote_value"]
        }
        Update: {
          caption_id?: string
          client_event_id?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          input_method?: Database["public"]["Enums"]["study_vote_input_method"]
          profile_id?: string
          session_id?: string | null
          study_caption_mapping_id?: number | null
          time_to_vote_ms?: number | null
          vote_value?: Database["public"]["Enums"]["study_vote_value"]
        }
        Relationships: [
          {
            foreignKeyName: "study_caption_vote_events_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_caption_vote_events_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "v_richest_image_dedup"
            referencedColumns: ["caption_id"]
          },
          {
            foreignKeyName: "study_caption_vote_events_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_caption_vote_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_caption_vote_events_study_caption_mapping_id_fkey"
            columns: ["study_caption_mapping_id"]
            isOneToOne: false
            referencedRelation: "study_caption_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      study_image_set_image_mappings: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          image_id: string
          modified_by_user_id: string
          modified_datetime_utc: string
          study_image_set_id: number
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          study_image_set_id: number
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          image_id?: string
          modified_by_user_id?: string
          modified_datetime_utc?: string
          study_image_set_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_image_set_image_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_image_set_image_mappings_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_image_set_image_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_image_set_image_mappings_study_image_set_id_fkey"
            columns: ["study_image_set_id"]
            isOneToOne: false
            referencedRelation: "study_image_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      study_image_sets: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          description: string | null
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          slug: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          description?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_image_sets_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_image_sets_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      term_types: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_types_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_types_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          definition: string
          example: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          priority: number
          term: string
          term_type_id: number | null
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          definition: string
          example: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number
          term: string
          term_type_id?: number | null
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          definition?: string
          example?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          priority?: number
          term?: string
          term_type_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_term_type_id_fkey"
            columns: ["term_type_id"]
            isOneToOne: false
            referencedRelation: "term_types"
            referencedColumns: ["id"]
          },
        ]
      }
      testflight_errors: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          error: string | null
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          error?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          error?: string | null
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "testflight_errors_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testflight_errors_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_personality_mappings: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          personality_id: number
          transcript_id: number
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          personality_id: number
          transcript_id: number
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          personality_id?: number
          transcript_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transcript_personality_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_personality_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_personality_mappings_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcript_personality_mappings_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          content: string
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          content: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          content?: string
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transcripts_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "universities_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "universities_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      university_major_mappings: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          major_id: number | null
          modified_by_user_id: string
          modified_datetime_utc: string
          university_id: number
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id: number
          major_id?: number | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          university_id: number
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          major_id?: number | null
          modified_by_user_id?: string
          modified_datetime_utc?: string
          university_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "university_major_mappings_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_major_mappings_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "university_majors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_major_mappings_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_major_mappings_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      university_majors: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
          name: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "university_majors_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "university_majors_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string | null
          id: string
          page: string | null
          rating: number | null
          suggestions: string | null
          user_id: string | null
          what_was_confusing: string | null
          what_worked: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page?: string | null
          rating?: number | null
          suggestions?: string | null
          user_id?: string | null
          what_was_confusing?: string | null
          what_worked?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page?: string | null
          rating?: number | null
          suggestions?: string | null
          user_id?: string | null
          what_was_confusing?: string | null
          what_worked?: string | null
        }
        Relationships: []
      }
      whitelist_email_addresses: {
        Row: {
          created_by_user_id: string
          created_datetime_utc: string
          email_address: string
          id: number
          modified_by_user_id: string
          modified_datetime_utc: string
        }
        Insert: {
          created_by_user_id?: string
          created_datetime_utc?: string
          email_address: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Update: {
          created_by_user_id?: string
          created_datetime_utc?: string
          email_address?: string
          id?: number
          modified_by_user_id?: string
          modified_datetime_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_email_addresses_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelist_email_addresses_modified_by_user_id_fkey"
            columns: ["modified_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_richest_image_dedup: {
        Row: {
          caption_id: string | null
          content: string | null
          created_datetime_utc: string | null
          image_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "captions_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      api_humor_flavor_stats_payload: { Args: never; Returns: Json }
      can_access_caption:
        | {
            Args: { target_caption_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.can_access_caption(target_caption_id => text), public.can_access_caption(target_caption_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { target_caption_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.can_access_caption(target_caption_id => text), public.can_access_caption(target_caption_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      can_access_image:
        | {
            Args: { target_image_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.can_access_image(target_image_id => text), public.can_access_image(target_image_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { target_image_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.can_access_image(target_image_id => text), public.can_access_image(target_image_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      can_access_invitation_by_token: {
        Args: { target_token: string }
        Returns: boolean
      }
      check_unique_image_report: {
        Args: { check_image_id: string; check_profile_id: string }
        Returns: boolean
      }
      cleanup_expired_invitations: { Args: never; Returns: undefined }
      get_daily_activity: {
        Args: { days_count?: number }
        Returns: {
          count: number
          date: string
        }[]
      }
      get_top_contributors: {
        Args: { limit_count?: number }
        Returns: {
          count: number
          name: string
        }[]
      }
      get_total_likes: { Args: never; Returns: number }
      increment_link_visit_count: {
        Args: { link_slug: string }
        Returns: undefined
      }
      is_superadmin:
        | {
            Args: { user_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.is_superadmin(user_id => text), public.is_superadmin(user_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { user_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.is_superadmin(user_id => text), public.is_superadmin(user_id => uuid). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      is_valid_category_image_mapping:
        | { Args: { category_id: number; img_id: string }; Returns: boolean }
        | { Args: { category_id: number; img_id: string }; Returns: boolean }
        | { Args: { category_id: number; img_id: string }; Returns: boolean }
      match_community_contexts: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          community_id: number
          id: number
          similarity: number
          text: string
        }[]
      }
      smart_deactivate_news: { Args: never; Returns: undefined }
    }
    Enums: {
      study_vote_input_method: "button" | "swipe" | "keyboard" | "unknown"
      study_vote_value:
        | "didnt get it"
        | "not funny at all"
        | "not very funny"
        | "meh"
        | "funny"
        | "very funny"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      study_vote_input_method: ["button", "swipe", "keyboard", "unknown"],
      study_vote_value: [
        "didnt get it",
        "not funny at all",
        "not very funny",
        "meh",
        "funny",
        "very funny",
      ],
    },
  },
} as const
