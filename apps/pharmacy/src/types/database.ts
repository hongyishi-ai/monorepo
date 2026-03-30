/**
 * Supabase 数据库类型定义
 * 提供类型安全的数据库操作
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'manager' | 'operator';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'manager' | 'operator';
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'manager' | 'operator';
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medicines: {
        Row: {
          id: string;
          barcode: string;
          name: string;
          specification: string | null;
          manufacturer: string | null;
          shelf_location: string | null;
          safety_stock: number;
          unit: string;
          category: 'internal' | 'external' | 'injection';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          barcode: string;
          name: string;
          specification?: string | null;
          manufacturer?: string | null;
          shelf_location?: string | null;
          safety_stock?: number;
          unit?: string;
          category?: 'internal' | 'external' | 'injection';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          barcode?: string;
          name?: string;
          specification?: string | null;
          manufacturer?: string | null;
          shelf_location?: string | null;
          safety_stock?: number;
          unit?: string;
          category?: 'internal' | 'external' | 'injection';
          created_at?: string;
          updated_at?: string;
        };
      };
      batches: {
        Row: {
          id: string;
          medicine_id: string;
          batch_number: string;
          production_date: string;
          expiry_date: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          medicine_id: string;
          batch_number: string;
          production_date: string;
          expiry_date: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          medicine_id?: string;
          batch_number?: string;
          production_date?: string;
          expiry_date?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_transactions: {
        Row: {
          id: string;
          medicine_id: string;
          batch_id: string;
          user_id: string;
          type: 'inbound' | 'outbound' | 'adjustment' | 'expired' | 'damaged';
          quantity: number;
          remaining_quantity: number;
          notes: string | null;
          reference_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          medicine_id: string;
          batch_id: string;
          user_id: string;
          type: 'inbound' | 'outbound' | 'adjustment' | 'expired' | 'damaged';
          quantity: number;
          remaining_quantity: number;
          notes?: string | null;
          reference_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          medicine_id?: string;
          batch_id?: string;
          user_id?: string;
          type?: 'inbound' | 'outbound' | 'adjustment' | 'expired' | 'damaged';
          quantity?: number;
          remaining_quantity?: number;
          notes?: string | null;
          reference_number?: string | null;
          created_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          key: string;
          value: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action_type:
            | 'create_medicine'
            | 'update_medicine'
            | 'delete_medicine'
            | 'create_batch'
            | 'update_batch'
            | 'delete_batch'
            | 'inbound_transaction'
            | 'outbound_transaction'
            | 'undo_transaction';
          table_name: string;
          record_id: string;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type:
            | 'create_medicine'
            | 'update_medicine'
            | 'delete_medicine'
            | 'create_batch'
            | 'update_batch'
            | 'delete_batch'
            | 'inbound_transaction'
            | 'outbound_transaction'
            | 'undo_transaction';
          table_name: string;
          record_id: string;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?:
            | 'create_medicine'
            | 'update_medicine'
            | 'delete_medicine'
            | 'create_batch'
            | 'update_batch'
            | 'delete_batch'
            | 'inbound_transaction'
            | 'outbound_transaction'
            | 'undo_transaction';
          table_name?: string;
          record_id?: string;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      undoable_transactions: {
        Row: {
          id: string;
          transaction_id: string;
          user_id: string;
          medicine_id: string;
          batch_id: string;
          original_quantity: number;
          is_undone: boolean;
          undo_deadline: string;
          created_at: string;
          undone_at: string | null;
          undone_by: string | null;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          user_id: string;
          medicine_id: string;
          batch_id: string;
          original_quantity: number;
          is_undone?: boolean;
          undo_deadline: string;
          created_at?: string;
          undone_at?: string | null;
          undone_by?: string | null;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          user_id?: string;
          medicine_id?: string;
          batch_id?: string;
          original_quantity?: number;
          is_undone?: boolean;
          undo_deadline?: string;
          created_at?: string;
          undone_at?: string | null;
          undone_by?: string | null;
        };
      };
    };
    Views: {
      expiring_medicines: {
        Row: {
          medicine_id: string;
          medicine_name: string;
          barcode: string;
          shelf_location: string | null;
          batch_id: string;
          batch_number: string;
          expiry_date: string;
          quantity: number;
          days_until_expiry: number;
          warning_threshold: number;
        };
      };
      low_stock_medicines: {
        Row: {
          id: string;
          name: string;
          barcode: string;
          shelf_location: string | null;
          safety_stock: number;
          total_quantity: number;
          shortage: number;
        };
      };
      medicine_inventory_summary: {
        Row: {
          id: string;
          name: string;
          barcode: string;
          specification: string | null;
          manufacturer: string | null;
          shelf_location: string | null;
          safety_stock: number;
          total_quantity: number;
          active_batches_count: number;
          earliest_expiry_date: string | null;
        };
      };
    };
    Functions: {
      get_medicine_stock: {
        Args: {
          medicine_id: string;
        };
        Returns: {
          total_quantity: number;
          active_batches: number;
          earliest_expiry: string | null;
        }[];
      };
      get_medicine_batches_fifo: {
        Args: {
          medicine_id: string;
        };
        Returns: {
          batch_id: string;
          batch_number: string;
          production_date: string;
          expiry_date: string;
          quantity: number;
          days_until_expiry: number;
        }[];
      };
      get_undoable_transactions: {
        Args: {
          p_user_id?: string;
        };
        Returns: {
          id: string;
          transaction_id: string;
          user_id: string;
          user_name: string;
          medicine_id: string;
          medicine_name: string;
          batch_id: string;
          batch_number: string;
          original_quantity: number;
          undo_deadline: string;
          created_at: string;
          time_remaining: string;
        }[];
      };
      undo_outbound_transaction: {
        Args: {
          p_undoable_transaction_id: string;
          p_user_id: string;
        };
        Returns: Record<string, unknown>;
      };
      log_audit_action: {
        Args: {
          p_user_id: string;
          p_action_type: string;
          p_table_name: string;
          p_record_id: string;
          p_old_values?: Record<string, unknown>;
          p_new_values?: Record<string, unknown>;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// 导出常用类型
export type User = Database['public']['Tables']['users']['Row'];
export type Medicine = Database['public']['Tables']['medicines']['Row'];
export type Batch = Database['public']['Tables']['batches']['Row'];
export type InventoryTransaction =
  Database['public']['Tables']['inventory_transactions']['Row'];
export type SystemSetting =
  Database['public']['Tables']['system_settings']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type UndoableTransaction =
  Database['public']['Tables']['undoable_transactions']['Row'];

// 导出视图类型
export type ExpiringMedicine =
  Database['public']['Views']['expiring_medicines']['Row'];
export type LowStockMedicine =
  Database['public']['Views']['low_stock_medicines']['Row'];
export type MedicineInventorySummary =
  Database['public']['Views']['medicine_inventory_summary']['Row'];

// 导出函数返回类型
export type MedicineStock =
  Database['public']['Functions']['get_medicine_stock']['Returns'][0];
export type MedicineBatchFIFO =
  Database['public']['Functions']['get_medicine_batches_fifo']['Returns'][0];
export type UndoableTransactionWithDetails =
  Database['public']['Functions']['get_undoable_transactions']['Returns'][0];

// 导出插入类型
export type InsertUser = Database['public']['Tables']['users']['Insert'];
export type InsertMedicine =
  Database['public']['Tables']['medicines']['Insert'];
export type InsertBatch = Database['public']['Tables']['batches']['Insert'];
export type InsertInventoryTransaction =
  Database['public']['Tables']['inventory_transactions']['Insert'];
export type InsertSystemSetting =
  Database['public']['Tables']['system_settings']['Insert'];
export type InsertAuditLog =
  Database['public']['Tables']['audit_logs']['Insert'];
export type InsertUndoableTransaction =
  Database['public']['Tables']['undoable_transactions']['Insert'];

// 导出更新类型
export type UpdateUser = Database['public']['Tables']['users']['Update'];
export type UpdateMedicine =
  Database['public']['Tables']['medicines']['Update'];
export type UpdateBatch = Database['public']['Tables']['batches']['Update'];
export type UpdateInventoryTransaction =
  Database['public']['Tables']['inventory_transactions']['Update'];
export type UpdateSystemSetting =
  Database['public']['Tables']['system_settings']['Update'];
export type UpdateAuditLog =
  Database['public']['Tables']['audit_logs']['Update'];
export type UpdateUndoableTransaction =
  Database['public']['Tables']['undoable_transactions']['Update'];
