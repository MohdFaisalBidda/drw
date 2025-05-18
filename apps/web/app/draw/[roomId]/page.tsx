import RoomCanvas from "../../_components/RoomCanvas";

export default async function CanvasPage({ params }: { params: any }) {
  const roomId = (await params).roomId;

  return <RoomCanvas roomId={roomId} />;
}
