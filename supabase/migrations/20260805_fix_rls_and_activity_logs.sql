-- ============================================================
-- Migration: Fix RLS DELETE policies + ensure activity_logs table
-- Date: 2026-08-05
-- ============================================================

-- 1. Tạo bảng activity_logs nếu chưa có
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('owner', 'manager', 'staff')),
  action TEXT NOT NULL,
  detail TEXT,
  category TEXT NOT NULL CHECK (category IN ('sale', 'inventory', 'customer', 'debt', 'cashbook', 'account'))
);

-- Enable RLS on activity_logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- activity_logs: Authenticated users can INSERT
CREATE POLICY IF NOT EXISTS "activity_logs_insert_authenticated"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- activity_logs: Authenticated users can SELECT
CREATE POLICY IF NOT EXISTS "activity_logs_select_authenticated"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

-- activity_logs: Only owner can DELETE (clear log)
CREATE POLICY IF NOT EXISTS "activity_logs_delete_owner"
  ON activity_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
    )
  );

-- 2. Thêm DELETE policy cho bảng customers (owner + manager)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'customers_delete_owner_manager'
  ) THEN
    CREATE POLICY "customers_delete_owner_manager"
      ON customers FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
      );
  END IF;
END $$;

-- 3. Thêm DELETE policy cho bảng sales (owner + manager)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'sales_delete_owner_manager'
  ) THEN
    CREATE POLICY "sales_delete_owner_manager"
      ON sales FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
      );
  END IF;
END $$;

-- 4. Thêm DELETE policy cho bảng sale_items (owner + manager)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'sale_items_delete_owner_manager'
  ) THEN
    CREATE POLICY "sale_items_delete_owner_manager"
      ON sale_items FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
      );
  END IF;
END $$;

-- 5. Thêm DELETE policy cho bảng debts (owner + manager)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'debts' AND policyname = 'debts_delete_owner_manager'
  ) THEN
    CREATE POLICY "debts_delete_owner_manager"
      ON debts FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
      );
  END IF;
END $$;