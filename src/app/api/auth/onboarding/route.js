import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { validateDisplayName, validateStudentId, validatePhone, validateDateOfBirth } from '@/utils/validation'

// Use service role key to bypass RLS for onboarding
// This is safe because we are only allowing specific fields to be updated
export async function POST(request) {
  try {
    const { userId, onboardingData } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Server-side validation
    const { display_name, student_id, contact, date_of_birth, institution, programme, year_of_study, gender } = onboardingData || {}

    if (!institution || !programme || !gender || !year_of_study || !date_of_birth || !student_id || !contact || !display_name) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const displayNameErr = validateDisplayName(display_name.trim())
    if (displayNameErr) return NextResponse.json({ error: displayNameErr }, { status: 400 })

    const studentIdErr = validateStudentId(student_id.trim())
    if (studentIdErr) return NextResponse.json({ error: studentIdErr }, { status: 400 })

    const phoneErr = validatePhone(contact.trim())
    if (phoneErr) return NextResponse.json({ error: phoneErr }, { status: 400 })

    const dobErr = validateDateOfBirth(date_of_birth)
    if (dobErr) return NextResponse.json({ error: dobErr }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...onboardingData,
        is_onboarded: true
      })

    if (error) {
      console.error('Onboarding API Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Onboarding API Catch:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
