import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tclogfxdqgifnrllykhv.supabase.co';
// Publishable (anon) key — safe to expose; access is limited by Row Level Security.
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_rTOq0M4d3fGAMYki6kPV8A_lANH46u-';

export function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export async function getProducts() {
  const { data, error } = await supabase()
    .from('products')
    .select('*')
    .order('id');
  if (error) throw error;
  return data;
}

export async function getProduct(slug) {
  const { data } = await supabase()
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function getArticles() {
  const { data, error } = await supabase()
    .from('journal_articles')
    .select('*')
    .order('id');
  if (error) throw error;
  return data;
}

export async function getArticle(slug) {
  const { data } = await supabase()
    .from('journal_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data;
}

export async function getDrops() {
  const { data, error } = await supabase().from('drops').select('*').order('id');
  if (error) throw error;
  return data;
}

export async function getComingSoon() {
  const { data, error } = await supabase().from('coming_soon').select('*').order('id');
  if (error) throw error;
  return data;
}
