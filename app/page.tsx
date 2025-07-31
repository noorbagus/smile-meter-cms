// app/page.tsx
import { redirect } from 'next/navigation'
import { supabase, getServiceSupabase } from '@/lib/supabase'

export default async function HomePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect based on authentication status
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }

  // This will never be rendered
  return null
}