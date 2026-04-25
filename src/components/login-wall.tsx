"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogInIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoginWallProps {
  title: string;
  description: string;
  primaryLabel?: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export function LoginWall({
  title,
  description,
  primaryLabel = "GitHub 登录",
  secondaryLabel,
  secondaryHref,
}: LoginWallProps) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center justify-center py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <LogInIcon className="size-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => void signIn("github")}>
          {primaryLabel}
        </Button>
        <Link
          href={secondaryHref}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}
