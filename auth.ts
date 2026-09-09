import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Team number", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.toString().trim();
        const password = credentials?.password?.toString();
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({
          where: { username },
          include: { team: true },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.team?.number ?? user.username,
          email: user.email,
          teamNumber: user.team?.number ?? null,
          teamId: user.teamId,
          role: user.role,
        };
      },
    }),
  ],
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
});
