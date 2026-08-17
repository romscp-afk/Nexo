-- Provider/customer WhatsApp contact number (E.164, e.g. +6591234567)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

NOTIFY pgrst, 'reload schema';
