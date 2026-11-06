'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy } from 'lucide-react'
import { ShareButton } from '@/components/ui/share-button' //

interface ShareModalProps {
  shareUrl: string
  /** If true, the dialog opens immediately without clicking the share button. */
  autoOpen?: boolean
  iconWidth?: number
  iconHeight?: number
  buttonClassName?: string
}

export default function ShareModal({
  shareUrl,
  autoOpen = false,
  iconWidth,
  iconHeight,
  buttonClassName,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const [isShared, setIsShared] = useState(false)

  // Controls the open/closed state of the Dialog
  const [open, setOpen] = useState(autoOpen)

  // Copy URL to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  // Trigger share animation and reset so it can replay next time
  const handleShareClick = () => {
    setIsShared(true)
    // Reset after animation completes so subsequent clicks replay it
    window.setTimeout(() => setIsShared(false), 10000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 
        If autoOpen is false, the user can click the share button to open the dialog.
        If autoOpen is true, the dialog is opened immediately on page load.
      */}
      <DialogTrigger asChild>
        {/* Show the ShareButton only if NOT auto-opening. 
            Otherwise, we’d rely on the dialog opening automatically. */}
        {!autoOpen && (
          <ShareButton
            shared={isShared}
            onClick={handleShareClick}
            iconWidth={iconWidth ?? 20}
            iconHeight={iconHeight ?? 20}
            className={buttonClassName}
          />
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
        </DialogHeader>

        {/* Input + Copy Button */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="share-link" className="sr-only">
              Share Link
            </Label>
            <Input id="share-link" defaultValue={shareUrl} readOnly />
          </div>
          <Button type="button" size="sm" className="px-3" onClick={handleCopy}>
            {copied ? 'Copied!' : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
