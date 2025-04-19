import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@repo/db/prisma'
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: "/sign-in",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "john@example.com" },
                password: { label: "Password", type: "password", placeholder: "Your password" },
            },
            async authorize(credentials, req) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        throw new Error("Missing email or password");
                    }

                    console.log("🔐 Checking user:", credentials.email);

                    const user = await prisma.user.findFirst({
                        where: { email: credentials.email },
                    });

                    if (!user || !user.password) {
                        console.error("❌ User not found or missing password");
                        throw new Error("Invalid email or password");
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        console.error("❌ Password mismatch");
                        throw new Error("Invalid email or password");
                    }

                    console.log("✅ User authenticated:", user.email);

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };
                } catch (err) {
                    console.error("🔥 ERROR in authorize():", err);
                    throw err; // DO NOT return null here
                }
            }


        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user && "id" in user) {
                token.id = user.id
                token.email = user.email
            }

            if (!process.env.NEXTAUTH_SECRET) {
                throw new Error("JWT_SECRET is not set")
            }

            token.accessToken = jwt.sign({ id: token.id, email: token.email }, process.env.NEXTAUTH_SECRET, { expiresIn: "7d" })

            return token
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string,
                    session.user.email = token.email as string,
                    session.accessToken = token.accessToken as string
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development' 
}
