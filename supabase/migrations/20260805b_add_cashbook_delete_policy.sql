-- ============================================================
-- Migration: Add RLS DELETE policy for cashbook
-- Date: 2026-08-05
-- ============================================================

-- Ensure RLS enabled on cashbook
ALTER TABLE cashbook ENABLE ROW LEVEL SECURITY;

-- Allow DELETE on cashbook for owner + manager
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cashbook' AND policyname = 'cashbook_delete_owner_manager'
  ) THEN
    CREATE POLICY "cashbook_delete_owner_manager"
      ON cashbook FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role IN ('owner', 'manager')
        )
      );
  END IF;
END $$;