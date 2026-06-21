import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid h-[34px] w-[34px] place-items-center overflow-hidden rounded-[10px]">
        <Image
          src="/logo.png"
          alt="Onyx logo"
          fill
          className="object-cover"
        />
      </span>
      <span className="font-display text-[19px] font-bold tracking-tight text-foreground">
        Onyx
      </span>
    </Link>
  );
}
