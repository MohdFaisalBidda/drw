import authenticate from "@/lib/authenticate";
import { prisma } from "@repo/db/prisma";
import { NextResponse } from "next/server";

export async function POST(req: NextResponse) {
    const session = await authenticate();
    console.log(session,"sessoin in post");
    
    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { slug, adminId } = await req.json();
    const room = await prisma.room.create({
        data: {
            slug,
            adminId,
        },
    });
    return NextResponse.json({
        roomData: room,
        status: "success",
    });
}

export async function GET(req: NextResponse) {
    const session = await authenticate();
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { slug } = await req.json();
    const room = await prisma.room.findUnique({
        where: {
            slug,
        },
    });

    if (!room) {
        return new Response("Room not found", { status: 404 });
    }
    return NextResponse.json({
        roomData: room,
        status: "success",
    });
}