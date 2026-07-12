import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names (clsx + tailwind-merge).
 */
const cn: (...inputs: ClassValue[]) => string = (
  ...inputs: ClassValue[]
): string => twMerge(clsx(inputs));

export { cn };
