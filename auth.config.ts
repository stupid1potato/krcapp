import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.teamNumber = user.teamNumber ?? null;
        token.teamId = user.teamId ?? null;
        token.role = user.role ?? "participant";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.teamNumber = (token.teamNumber as string | null) ?? null;
      session.user.teamId = (token.teamId as string | null) ?? null;
      session.user.role = (token.role as string) ?? "participant";
      return session;
    },
  },
} satisfies NextAuthConfig;
