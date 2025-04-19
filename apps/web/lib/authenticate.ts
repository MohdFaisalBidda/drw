import { getServerSession } from "next-auth";
import { getSession } from "next-auth/react";
import { NextResponse } from "next/server";

export default async function authenticate() {
    const session = await getServerSession();
    console.log(session,"session in authenticate");
    
    if (!session?.user) {
        return null;
    }
    return session;
}