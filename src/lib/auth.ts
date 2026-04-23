import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        token.github_id = profile.id as unknown as number;
        token.github_username = profile.login as unknown as string;
        token.avatar_url = (profile as Record<string, unknown>).avatar_url as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.github_id = token.github_id as number;
      session.user.github_username = token.github_username as string;
      session.user.avatar_url = token.avatar_url as string;
      return session;
    },
  },
});
