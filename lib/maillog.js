import { supabase } from './supabase';

// Best-effort audit trail of every transactional email the site sends.
// Visible in the admin panel; never throws.
export async function logMail(email, kind, subject, status, error) {
  try {
    await supabase().from('mail_log').insert({
      email: String(email).slice(0, 200),
      kind: String(kind).slice(0, 40),
      subject: String(subject || '').slice(0, 300),
      status: String(status).slice(0, 20),
      error: error ? String(error).slice(0, 400) : null,
    });
  } catch (e) {
    // logging must never break the request
  }
}
