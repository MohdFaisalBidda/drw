import { getAllRooms } from "../actions";
import JoinRoomPage from "./_components/JoinRoom";

export default async function Home() {
  const allRooms = await getAllRooms();
  return <JoinRoomPage allRooms={allRooms.data?.rooms} />;
}
