
import { cn } from "@/lib/utils"
import logoImage from "../../../components/logo.jpg"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img src={logoImage} alt="Logo" className="h-8 w-auto" />
      <div className="font-bold text-2xl text-primary">ReadAlong</div>
    </div>
  )
}
