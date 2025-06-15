import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@repo/db'
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

                    const accessToken = jwt.sign(
                        {
                            userId: user.id,
                            email: user.email,
                            name: user.name,
                        },
                        process.env.NEXTAUTH_SECRET!,
                        { expiresIn: '24h' }
                    );
                    console.log("✅ User authenticated:", user.email, accessToken);

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        accessToken
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
            if (user && "accessToken" in user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name,
                    token.accessToken = user.accessToken as string;
            }

            return token
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string,
                    session.user.email = token.email as string,
                    session.user.name = token.name as string
                session.accessToken = token.accessToken as string;
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development'
}
