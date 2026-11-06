import Link from "next/link";

import { resetPasswordAction } from "@/app/actions/auth";
import { FormMessage, type Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ResetPassword(props: {
	searchParams: Promise<Message>;
}) {
	const searchParams = await props.searchParams;
	if ("message" in searchParams) {
		return (
			<div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center
						    gap-2 p-4">
				<FormMessage message={searchParams} />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Reset password</CardTitle>
					<CardDescription>
						Please enter your new password below.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="flex flex-col gap-6">
						<div className="grid gap-2">
							<Label htmlFor="password">New password</Label>
							<Input
								type="password"
								name="password"
								placeholder="New password"
								required
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="confirmPassword">Confirm password</Label>
							<Input
								type="password"
								name="confirmPassword"
								placeholder="Confirm password"
								required
							/>
						</div>
						<SubmitButton
							formAction={resetPasswordAction}
							pendingText="Resetting..."
						>
							Reset password
						</SubmitButton>
						<FormMessage message={searchParams} />
					</form>
					<div className="mt-4 text-center text-sm">
						Remembered your password?{" "}
						<Link className="underline underline-offset-4" href="/login">
							Login
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
