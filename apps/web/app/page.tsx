import { cookies } from "next/headers";
import { getAllRooms } from "../actions";
import JoinRoomPage from "./_components/JoinRoom";
import { redirect } from "next/navigation";
import Header from "./_components/Header";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession();
  console.log(session?.accessToken, "token in home");

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
