import type { ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return inputs.flat().filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}
