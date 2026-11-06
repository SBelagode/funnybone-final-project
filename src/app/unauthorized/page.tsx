import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-center">Access Denied</CardTitle>
          <CardDescription className="text-center">
            Your account is currently disabled. You have been logged out.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/sign-up">Return to Sign Up</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
