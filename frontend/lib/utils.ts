import { clsx, type ClassValue } from "./clsx";

/** Lightweight class merger (clsx-compatible without extra dep). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(...inputs);
}
