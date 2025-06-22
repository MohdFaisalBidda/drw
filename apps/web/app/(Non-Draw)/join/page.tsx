import { redirect } from "next/navigation";
import authenticate from "@/lib/authenticate";
import JoinRoomPage from "@/app/_components/JoinRoom";
import Header from "@/app/_components/Header";
import { getAllRooms } from "@/actions";

export default async function Home() {
  const session = await authenticate();
  console.log(session, "session in home");

  if (!session?.user) {
    redirect("/sign-in");
  }

  const allRooms = await getAllRooms();
  return (
    <>
      <Header />
      <JoinRoomPage allRooms={allRooms.data?.rooms || []} />
    </>
  );
}
