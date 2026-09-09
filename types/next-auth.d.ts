import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      teamNumber: string | null;
      teamId: string | null;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    teamNumber?: string | null;
    teamId?: string | null;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    teamNumber?: string | null;
    teamId?: string | null;
    role?: string;
  }
}
