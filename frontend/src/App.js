import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import Admin from "@/pages/Admin";
import Privacy from "@/pages/Privacy";

function App() {
  return (
    <div className="App min-h-screen bg-ink text-[var(--text)]">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}

export default App;
