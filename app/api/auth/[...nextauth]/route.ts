import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/primsa";
import bcrypt from 'bcryptjs';
import { AuthOptions } from 'next-auth';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Email Login",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Email does not exist");
        }

        if (!user.password) {
          throw new Error("Please log in with your social account");
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before logging in");
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isCorrectPassword) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id.toString(),
          name: user.name || "",
          email: user.email || "",
        };
      }
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id; // user.id is now a string
        token.name = user.name || "";
        token.email = user.email || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as User).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Allow OAuth login without email verification
      if (account?.provider !== 'credentials') {
        return true;
      }

      // For credentials provider, check email verification
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (!dbUser?.emailVerified) {
        throw new Error("Please verify your email before logging in");
      }

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "test-secret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
