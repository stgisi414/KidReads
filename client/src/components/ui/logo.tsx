
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="font-bold text-2xl text-primary">ReadAlong</div>
    </div>
  )
}
