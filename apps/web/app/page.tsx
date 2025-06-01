import { cookies } from "next/headers";
import { getAllRooms } from "../actions";
import JoinRoomPage from "./_components/JoinRoom";
import { redirect } from "next/navigation";
import Header from "./_components/Header";
import { getSession } from "next-auth/react";
import authenticate from "@/lib/authenticate";

export default async function Home() {
  const session = await authenticate();
  console.log(session,"session in home");
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  const allRooms = await getAllRooms();
  return (
    <>
      <Header />
      <JoinRoomPage allRooms={allRooms.data?.rooms} />
    </>
  );
}
