'use server'

import { createClient } from '@/utils/supabase/server'
import { Resend } from 'resend'
import { BugReportEmailTemplate } from '@/components/email-template'

const BUG_REPORT_FROM = process.env.BUG_REPORT_FROM || 'Crackd.ai <noreply@crackd.ai>'
const BUG_REPORT_RECEIVER = process.env.BUG_REPORT_RECEIVER || 'bugs@crackd.ai'
const RESEND_API_KEY = process.env.RESEND_API_KEY || 'fake_key'

const resend = new Resend(RESEND_API_KEY)

// Inserts a new bug report.
export async function createBugReportAction(formData: FormData) {
  // Extract form values
  const subject = formData.get('subject')?.toString() || ''
  const message = formData.get('message')?.toString() || ''

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user || !user.email) {
    throw new Error('User not found or not logged in.')
  }

  // Insert new bug report
  const { error } = await supabase.from('bug_reports').insert({
    profile_id: user.id,
    subject,
    message,
    created_by_user_id: user.id,
    modified_by_user_id: user.id,
  })

  if (error) {
    throw new Error(`Error inserting bug report: ${error.message}`)
  }

  // Send email to bugs@crackd.ai and the user
  try {
    const { error } = await resend.emails.send({
      from: BUG_REPORT_FROM,
      to: [BUG_REPORT_RECEIVER, user.email],
      subject: subject ? `Bug Report: ${subject}` : 'New Bug Report',
      react: BugReportEmailTemplate({
        subject,
        message,
        userEmail: user.email,
      }) as React.ReactElement,
    })

    if (error) {
      console.error('Error sending bug report email:', error)
      // Don't throw here, as the bug report was already saved to the database
    }
  } catch (error) {
    console.error('Error sending bug report email:', error)
    // Don't throw here, as the bug report was already saved to the database
  }

  // Don't return anything since form action expects void
}
