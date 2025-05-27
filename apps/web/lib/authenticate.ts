import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";

export default async function authenticate() {
    const session = await getServerSession(authOptions);
    console.log(session,"session in authenticate");
    
    if (!session?.user) {
        return null;
    }
    return session;
}