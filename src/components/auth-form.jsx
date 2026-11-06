'use client'

import { signInWithGoogleAction } from '@/app/actions/auth'
import { SubmitButton } from '@/components/submit-button'
import Image from 'next/image'

const AuthForm = ({ variant = 'login' }) => {
  return (
    <div>
      <form action={signInWithGoogleAction}>
        <SubmitButton
          className="w-full flex items-center justify-center gap-1"
          pendingText={
            variant === 'login' ? 'Logging in with Google...' : 'Signing up with Google...'
          }
        >
          <Image src="/google.svg" alt="Google logo" width={20} height={20} className="w-5 h-5" />
          {variant === 'login' ? 'Login with Google' : 'Sign up with Google'}
        </SubmitButton>
      </form>
    </div>
  )
}

export default AuthForm
