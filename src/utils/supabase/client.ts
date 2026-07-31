import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkgcujyhzywkdyyzfgtu.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZ2N1anloenl3a2R5eXpmZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Njk2MzgsImV4cCI6MjEwMTA0NTYzOH0.q_QUqnNuTkiR__tmkIZpx4PLzsrlURMxWhXceSvFYdo';

  return createBrowserClient(url, key);
}
