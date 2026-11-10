import { Suspense } from "react";
import Classroom from "../../../components/Classroom";

export default function RoomPage() {
  return (
    <Suspense>
      <Classroom />
    </Suspense>
  );
}
