import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** cn — merge conditional class names, de-duplicating Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
