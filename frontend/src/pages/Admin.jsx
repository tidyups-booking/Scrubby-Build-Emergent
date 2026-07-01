import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Lock, Loader2, RefreshCw, Phone, Mail, MapPin, Inbox } from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/data";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async (pw) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/quotes`, { headers: { "X-Admin-Password": pw } });
      setQuotes(res.data);
      setAuthed(true);
    } catch (e) {
      toast.error("Wrong password.");
    } finally {
      setLoading(false);
    }
  };

  const login = (e) => { e.preventDefault(); if (password) load(password); };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="aurora pointer-events-none fixed inset-0 -z-10 opacity-70" />
        <motion.form
          data-testid="admin-login-form"
          onSubmit={login}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-sm rounded-3xl p-8"
        >
          <div className="brand-gradient-bg mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"><Lock className="h-7 w-7 text-white" /></div>
          <h1 className="font-display mt-5 text-center text-2xl font-extrabold">Leads Dashboard</h1>
          <p className="mt-1 text-center text-sm text-white/50">Tidyups admin access</p>
          <input
            data-testid="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="mt-6 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-brand-pink"
          />
          <button data-testid="admin-login-btn" disabled={loading} className="brand-gradient-bg mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enter"}
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold"><span className="brand-gradient-text">Quote</span> Leads</h1>
          <p className="text-sm text-white/50">{quotes.length} total request{quotes.length !== 1 ? "s" : ""}</p>
        </div>
        <button data-testid="admin-refresh-btn" onClick={() => load(password)} className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-brand-pink hover:text-brand-pink">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {quotes.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-3xl py-20 text-center">
          <Inbox className="h-12 w-12 text-white/30" />
          <p className="mt-4 text-white/50">No quote requests yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quotes.map((q) => (
            <div key={q.id} data-testid={`lead-${q.id}`} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{q.name}</h3>
                  <p className="text-sm font-semibold text-brand-pink">{q.service_type}</p>
                </div>
                <span className="rounded-full bg-brand-magenta/15 px-3 py-1 text-xs font-semibold text-brand-pink">{q.status}</span>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-white/65">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-white/40" /> <a href={`tel:${q.phone}`} className="hover:text-brand-pink">{q.phone}</a></p>
                {q.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-white/40" /> {q.email}</p>}
                {q.property_type && <p className="text-white/50">Property: {q.property_type}</p>}
                {(q.bedrooms || q.bathrooms) && (
                  <p className="text-white/50">
                    {q.bedrooms && `${q.bedrooms} bed`}{q.bedrooms && q.bathrooms && " · "}{q.bathrooms && `${q.bathrooms} bath`}
                  </p>
                )}
                {q.address && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-white/40" /> {q.address}</p>}
                {q.preferred_date && <p className="text-white/50">Preferred: {q.preferred_date}</p>}
                {q.message && <p className="mt-2 rounded-lg bg-black/25 p-3 text-white/70">{q.message}</p>}
              </div>
              <p className="mt-4 text-xs text-white/35">{new Date(q.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-10 text-center text-xs text-white/30">{BRAND.name} · Internal use only</p>
    </div>
  );
}
