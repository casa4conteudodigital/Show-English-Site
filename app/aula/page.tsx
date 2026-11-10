import { Suspense } from "react";
import Classroom from "../../components/Classroom";

export default function Page() {
  return (
    <Suspense>
      <Classroom />
    </Suspense>
  );
}
