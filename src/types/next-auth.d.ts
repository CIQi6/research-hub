import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      github_id: number;
      github_username: string;
      avatar_url: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    github_id: number;
    github_username: string;
    avatar_url: string;
  }
}
