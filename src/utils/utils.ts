import { type ClassValue, clsx } from "clsx";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

export const encodedRedirect = (
	type: "error" | "success",
	path: string,
	message: string,
): never => {
	return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
};

export const cn = (...inputs: ClassValue[]) => {
	return twMerge(clsx(inputs));
};
