import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gkgcujyhzywkdyyzfgtu.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrZ2N1anloenl3a2R5eXpmZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0Njk2MzgsImV4cCI6MjEwMTA0NTYzOH0.q_QUqnNuTkiR__tmkIZpx4PLzsrlURMxWhXceSvFYdo';

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component ignore
          }
        },
      },
    }
  );
}
