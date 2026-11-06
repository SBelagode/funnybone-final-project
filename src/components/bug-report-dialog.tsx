'use client'

import * as React from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { createBugReportAction } from '@/app/actions/bug-reports'
import { Input } from '@/components/ui/input'

import { useToast } from '@/hooks/use-toast'

export function BugReportDialog() {
  const [open, setOpen] = React.useState(false)
  const { toast } = useToast()

  const [submitting, setSubmitting] = React.useState(false)

  const formRef = React.useRef<HTMLFormElement>(null)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault() // Prevent newline
      formRef.current?.requestSubmit() // Triggers native submit
    }
  }

  // Handles form submission and toast feedback
  const handleSubmit = async (formData: FormData) => {
    if (submitting) return
    setSubmitting(true)
    try {
      // Show empty message toast
      if (!formData.get('message')?.toString().trim()) {
        toast({
          title: 'Message Required',
          description: 'Please describe the bug before submitting.',
          variant: 'destructive',
        })
        return
      }

      await createBugReportAction(formData)

      // Show confirmation toast
      toast({
        title: 'Bug Report Submitted',
        description: "Thanks! We'll look into the issue shortly.",
        duration: 5000, // 5 seconds
      })

      // Close the dialog after a short delay
      setTimeout(() => {
        setOpen(false)
      }, 3000)
    } catch {
      toast({
        title: 'Submission Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger Button */}
      <DialogTrigger asChild>
        <a
          className="text-muted-foreground hover:text-foreground transition-colors text-xs
                      sm:text-sm md:text-base cursor-pointer w-full"
        >
          Report a Bug
        </a>
      </DialogTrigger>

      {/* Dialog Content */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Let us know about any issues or bugs you&apos;ve encountered.
          </DialogDescription>
        </DialogHeader>

        {/* 
          Submit the form to the server action. 
        */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleSubmit(formData)
          }}
          ref={formRef}
        >
          <div className="space-y-4">
            {/* Subject field */}
            <Input name="subject" placeholder="Short Subject (optional)" />

            {/* Message text area */}
            <Textarea
              name="message"
              placeholder="Describe the bug here..."
              className="min-h-[120px]"
              onKeyDown={handleKeyDown}
            />
          </div>

          <DialogFooter style={{ paddingTop: '10px' }}>
            {/* POST  form to createBugReportAction.*/}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
