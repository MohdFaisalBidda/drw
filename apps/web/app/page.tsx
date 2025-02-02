import { cookies } from "next/headers";
import { getAllRooms } from "../actions";
import JoinRoomPage from "./_components/JoinRoom";
import { redirect } from "next/navigation";

export default async function Home() {
  const token = (await cookies()).get("token")?.value;
  console.log(token, "token in home");

  if (!token) {
    redirect("/sign-in");
  }

  const allRooms = await getAllRooms();
  return <JoinRoomPage allRooms={allRooms.data?.rooms} />;
}
