import { PageProps } from "../../../.next/types/app/draw/[roomId]/page";
import RoomCanvas from "../../_components/RoomCanvas";

export default async function CanvasPage({ params }: PageProps) {
  const roomId = (await params).roomId;

  return <RoomCanvas roomId={roomId} />;
}
