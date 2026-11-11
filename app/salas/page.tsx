import { Suspense } from "react";
import Dashboard from "../../components/Dashboard";

export default function RoomsPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
