import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Lock, Loader2, RefreshCw, Phone, Mail, MapPin, Inbox, Upload, Trash2, ImageIcon, Images, GripVertical,
  FileSpreadsheet, ExternalLink, Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BRAND, resolveImageUrl } from "@/lib/data";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sheets = params.get("sheets");
    if (sheets === "connected") {
      toast.success("Google Sheets connected! New quotes will sync automatically.");
    } else if (sheets === "error") {
      toast.error("Google Sheets connection failed. Please try again.");
    }
    if (sheets) window.history.replaceState({}, "", "/admin");
  }, []);

  const login = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      await axios.post(`${API}/admin/login`, {}, { headers: { "X-Admin-Password": password } });
      setAuthed(true);
    } catch {
      toast.error("Wrong password.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="font-display mt-5 text-center text-2xl font-extrabold">Admin Dashboard</h1>
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
      <h1 className="font-display text-3xl font-extrabold"><span className="brand-gradient-text">Tidyups</span> Admin</h1>
      <Tabs defaultValue="leads" className="mt-6">
        <TabsList className="bg-panel border border-white/10">
          <TabsTrigger value="leads" data-testid="tab-leads" className="data-[state=active]:bg-brand-magenta/20 data-[state=active]:text-brand-pink">Quote Leads</TabsTrigger>
          <TabsTrigger value="images" data-testid="tab-images" className="data-[state=active]:bg-brand-magenta/20 data-[state=active]:text-brand-pink">Site Images</TabsTrigger>
        </TabsList>
        <TabsContent value="leads" className="mt-6"><Leads password={password} /></TabsContent>
        <TabsContent value="images" className="mt-6"><ImageManager password={password} /></TabsContent>
      </Tabs>
      <p className="mt-10 text-center text-xs text-white/30">{BRAND.name} · Internal use only</p>
    </div>
  );
}

function SheetsCard({ password }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const headers = { "X-Admin-Password": password };

  const load = async () => {
    try {
      const res = await axios.get(`${API}/sheets/status`, { headers });
      setStatus(res.data);
    } catch {
      setStatus({ connected: false });
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = async () => {
    setBusy(true);
    try {
      const res = await axios.get(`${API}/sheets/connect-url`, { headers });
      window.location.href = res.data.url;
    } catch {
      toast.error("Could not start Google connection.");
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      await axios.post(`${API}/sheets/disconnect`, {}, { headers });
      toast.success("Google Sheets disconnected.");
      load();
    } catch {
      toast.error("Could not disconnect.");
    }
  };

  if (!status) return null;

  return (
    <div data-testid="sheets-card" className="glass mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Google Sheets Sync</p>
          <p data-testid="sheets-status" className="text-xs text-white/50">
            {status.connected
              ? `Connected${status.email ? ` as ${status.email}` : ""} · every new quote adds a row`
              : "Not connected · sync every quote to a Google Sheet in your Drive"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {status.connected ? (
          <>
            <a
              data-testid="sheets-open-link"
              href={status.sheet_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open Sheet
            </a>
            <button
              data-testid="sheets-disconnect-btn"
              onClick={disconnect}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/60 transition-colors hover:border-red-400/50 hover:text-red-300"
            >
              <Unplug className="h-3.5 w-3.5" /> Disconnect
            </button>
          </>
        ) : (
          <button
            data-testid="sheets-connect-btn"
            onClick={connect}
            disabled={busy}
            className="flex items-center gap-2 rounded-full bg-emerald-500/15 px-5 py-2.5 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Connect Google Sheets
          </button>
        )}
      </div>
    </div>
  );
}

function Leads({ password }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/quotes`, { headers: { "X-Admin-Password": password } });
      setQuotes(res.data);
      setLoaded(true);
    } catch {
      toast.error("Could not load leads.");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded && !loading) load();

  return (
    <div>
      <SheetsCard password={password} />
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-white/50">{quotes.length} total request{quotes.length !== 1 ? "s" : ""}</p>
        <button data-testid="admin-refresh-btn" onClick={load} className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-brand-pink hover:text-brand-pink">
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
                {(q.street_address || q.city || q.province || q.postal_code) ? (
                  <p data-testid={`lead-address-${q.id}`} className="flex items-center gap-2"><MapPin className="h-4 w-4 text-white/40" /> {[q.street_address, q.city, q.province, q.postal_code].filter(Boolean).join(", ")}</p>
                ) : q.address ? (
                  <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-white/40" /> {q.address}</p>
                ) : null}
                {q.preferred_date && <p className="text-white/50">Preferred: {q.preferred_date}</p>}
                {q.message && <p className="mt-2 rounded-lg bg-black/25 p-3 text-white/70">{q.message}</p>}
              </div>
              <p className="mt-4 text-xs text-white/35">{new Date(q.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageManager({ password }) {
  const [hero, setHero] = useState(null);
  const [why, setWhy] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const heroInput = useRef(null);
  const whyInput = useRef(null);
  const galleryInput = useRef(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/site-images`);
      setHero(res.data.hero || null);
      setWhy(res.data.why || null);
      setGallery(res.data.gallery || []);
      setLoaded(true);
    } catch {
      toast.error("Could not load images.");
    }
  };
  if (!loaded) load();

  const upload = async (file, section) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("section", section);
    if (section === "gallery") fd.append("label", label);
    try {
      await axios.post(`${API}/site-images/upload`, fd, { headers: { "X-Admin-Password": password } });
      toast.success(section === "gallery" ? "Photo added!" : "Image updated!");
      setLabel("");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await axios.delete(`${API}/site-images/${id}`, { headers: { "X-Admin-Password": password } });
      toast.success("Photo removed.");
      await load();
    } catch {
      toast.error("Could not remove photo.");
    } finally {
      setBusy(false);
    }
  };

  const persistOrder = async (ordered) => {
    try {
      await axios.post(`${API}/site-images/reorder`, { order: ordered.map((g) => g.id) }, { headers: { "X-Admin-Password": password } });
      toast.success("Order saved.");
    } catch {
      toast.error("Could not save order.");
      load();
    }
  };

  const onDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); setOverIndex(null); return; }
    const next = [...gallery];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    setGallery(next);
    setDragIndex(null);
    setOverIndex(null);
    persistOrder(next);
  };

  return (
    <div className="space-y-10">
      <p className="text-sm text-white/50">Changes go live on your site instantly — no redeploy needed.</p>

      {/* Hero */}
      <section data-testid="hero-manager">
        <div className="mb-3 flex items-center gap-2 text-brand-pink"><ImageIcon className="h-5 w-5" /><h2 className="font-display text-lg font-bold text-white">Hero Image</h2></div>
        <div className="glass overflow-hidden rounded-2xl">
          {hero ? (
            <img src={resolveImageUrl(hero.url)} alt="Hero" className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <div className="flex h-56 items-center justify-center text-white/40">No hero image</div>
          )}
          <div className="flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-white/50">Shown at the top of your landing page</span>
            <input ref={heroInput} type="file" accept="image/*" className="hidden" data-testid="hero-upload-input"
              onChange={(e) => { upload(e.target.files[0], "hero"); e.target.value = ""; }} />
            <button data-testid="hero-replace-btn" disabled={busy} onClick={() => heroInput.current?.click()}
              className="brand-gradient-bg flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Replace
            </button>
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section data-testid="why-manager">
        <div className="mb-3 flex items-center gap-2 text-brand-pink"><ImageIcon className="h-5 w-5" /><h2 className="font-display text-lg font-bold text-white">"Why Tidyups" Image</h2></div>
        <div className="glass overflow-hidden rounded-2xl">
          {why ? (
            <img src={resolveImageUrl(why.url)} alt="Why Us" className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <div className="flex h-56 items-center justify-center text-white/40">No image</div>
          )}
          <div className="flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-white/50">Shown in the "Reliable, detailed &amp; done right" section</span>
            <input ref={whyInput} type="file" accept="image/*" className="hidden" data-testid="why-upload-input"
              onChange={(e) => { upload(e.target.files[0], "why"); e.target.value = ""; }} />
            <button data-testid="why-replace-btn" disabled={busy} onClick={() => whyInput.current?.click()}
              className="brand-gradient-bg flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Replace
            </button>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section data-testid="gallery-manager">
        <div className="mb-3 flex items-center gap-2 text-brand-pink"><Images className="h-5 w-5" /><h2 className="font-display text-lg font-bold text-white">Our Work Gallery</h2></div>
        <div className="glass mb-5 flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Caption (optional)" data-testid="gallery-label-input"
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-pink" />
          <input ref={galleryInput} type="file" accept="image/*" className="hidden" data-testid="gallery-upload-input"
            onChange={(e) => { upload(e.target.files[0], "gallery"); e.target.value = ""; }} />
          <button data-testid="gallery-add-btn" disabled={busy} onClick={() => galleryInput.current?.click()}
            className="brand-gradient-bg flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Add Photo
          </button>
        </div>
        {gallery.length === 0 ? (
          <div className="glass flex flex-col items-center rounded-2xl py-14 text-center">
            <ImageIcon className="h-10 w-10 text-white/30" />
            <p className="mt-3 text-white/50">No gallery photos yet.</p>
          </div>
        ) : (
          <>
            <p className="mb-3 flex items-center gap-1.5 text-xs text-white/40"><GripVertical className="h-3.5 w-3.5" /> Drag photos to reorder how they appear on your site.</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" data-testid="gallery-reorder-grid">
              {gallery.map((g, i) => (
                <div
                  key={g.id}
                  data-testid={`manage-image-${g.id}`}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  onDrop={() => onDrop(i)}
                  className={`group relative cursor-grab overflow-hidden rounded-2xl border transition-all active:cursor-grabbing ${overIndex === i && dragIndex !== null ? "border-brand-pink ring-2 ring-brand-magenta/50" : "border-white/10"} ${dragIndex === i ? "opacity-40" : ""}`}
                >
                  <img src={resolveImageUrl(g.url)} alt={g.label} className="pointer-events-none h-40 w-full object-cover" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
                  <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-xs font-semibold text-white">
                    <GripVertical className="h-3.5 w-3.5" /> {i + 1}
                  </div>
                  {g.label && <p className="pointer-events-none absolute bottom-2 left-3 text-sm font-semibold text-white">{g.label}</p>}
                  <button data-testid={`delete-image-${g.id}`} disabled={busy} onClick={() => remove(g.id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
