import { Route, Routes } from "react-router-dom";

import { Header } from "@/components/Header";
import { Home } from "@/pages/Home";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}
