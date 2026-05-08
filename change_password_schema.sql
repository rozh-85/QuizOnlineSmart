-- =====================================================
-- Change User Password Function
-- =====================================================
-- This function allows root/admin/teacher accounts to change managed user
-- auth password via RPC. It uses SECURITY DEFINER to run
-- with elevated privileges so only the function (not the caller)
-- needs direct access to auth.users.
--
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =====================================================

-- Enable pgcrypto if not already enabled (needed for crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Create or replace the function
CREATE OR REPLACE FUNCTION change_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, auth, public
AS $$
BEGIN
  -- Validate password length
  IF LENGTH(new_password) < 4 THEN
    RAISE EXCEPTION 'Password must be at least 4 characters';
  END IF;

  IF public.current_profile_role() NOT IN ('root', 'admin', 'teacher') THEN
    RAISE EXCEPTION 'Only staff accounts can change passwords';
  END IF;

  IF public.current_profile_role() = 'teacher'
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = target_user_id AND role = 'student'
     ) THEN
    RAISE EXCEPTION 'Teachers can only change student passwords';
  END IF;

  -- Update the password in auth.users
  UPDATE auth.users
  SET
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  -- Check if user was found
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (authorization is checked in the function)
GRANT EXECUTE ON FUNCTION change_user_password(UUID, TEXT) TO authenticated;
