import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        nomorInduk: { label: "Nomor Induk", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.nomorInduk || !credentials?.password) {
          throw new Error("Nomor induk dan password harus diisi");
        }

        const user = await prisma.user.findUnique({
          where: { nomorInduk: credentials.nomorInduk },
        });

        if (!user || !user.isActive) {
          throw new Error("Nomor induk tidak ditemukan");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role as User["role"],
          nomorInduk: user.nomorInduk,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nomorInduk = user.nomorInduk;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.nomorInduk = token.nomorInduk;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
