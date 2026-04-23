"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Research Hub
        </Link>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link href="/bookmarks">
                <Button variant="ghost" size="sm">
                  Bookmarks
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Edit My Profile
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.avatar_url} />
                    <AvatarFallback>
                      {session.user.github_username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {session.user.github_username}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => signIn("github")} size="sm">
              Sign in with GitHub
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
