import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { SERVICE_OPTIONS, PROPERTY_OPTIONS, BEDROOM_OPTIONS, BATHROOM_OPTIONS, PROVINCE_OPTIONS } from "@/lib/data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const empty = {
  name: "", phone: "", email: "", service_type: "",
  property_type: "", bedrooms: "", bathrooms: "",
  street_address: "", city: "", province: "Alberta", postal_code: "",
  preferred_date: "", message: "",
};

export default function QuoteForm({ compact = false }) {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.service_type) {
      toast.error("Please fill in your name, phone and the service you need.");
      return;
    }
    if (!form.street_address || !form.city || !form.postal_code) {
      toast.error("Please fill in your street address, city and postal code.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/quotes`, form);
      setDone(true);
      toast.success("Quote request sent! We'll call you shortly. 🐰");
      setForm(empty);
    } catch (err) {
      toast.error("Something went wrong. Please call us at (780) 718-5092.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div
        data-testid="quote-success"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 text-center"
      >
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-pink" />
        <h3 className="font-display mt-4 text-2xl font-bold text-white">Request received!</h3>
        <p className="mt-2 text-muted-foreground">
          Thanks — a Tidyups team member will reach out within one business day with your free quote.
        </p>
        <button
          data-testid="quote-reset-btn"
          onClick={() => setDone(false)}
          className="mt-6 rounded-full border border-brand-magenta/50 px-6 py-2.5 text-sm font-semibold text-brand-pink transition-colors hover:bg-brand-magenta/10"
        >
          Send another request
        </button>
      </motion.div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand-pink focus:ring-2 focus:ring-brand-magenta/40";

  return (
    <form data-testid="quote-form" onSubmit={submit} className="glass rounded-3xl p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Full name *</label>
          <input data-testid="quote-name" className={inputCls} placeholder="Jane Doe" value={form.name} onChange={set("name")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Phone *</label>
          <input data-testid="quote-phone" className={inputCls} placeholder="(780) 000-0000" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Email</label>
          <input data-testid="quote-email" className={inputCls} placeholder="you@email.com" value={form.email} onChange={set("email")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Preferred date</label>
          <input data-testid="quote-date" type="date" className={inputCls} value={form.preferred_date} onChange={set("preferred_date")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Service needed *</label>
          <Select value={form.service_type} onValueChange={(v) => setForm((f) => ({ ...f, service_type: v }))}>
            <SelectTrigger data-testid="quote-service" className={inputCls + " h-[46px]"}>
              <SelectValue placeholder="Choose a service" />
            </SelectTrigger>
            <SelectContent className="bg-panel2 border-brand-magenta/30 text-white">
              {SERVICE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-brand-magenta/20">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Property type</label>
          <Select value={form.property_type} onValueChange={(v) => setForm((f) => ({ ...f, property_type: v }))}>
            <SelectTrigger data-testid="quote-property" className={inputCls + " h-[46px]"}>
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent className="bg-panel2 border-brand-magenta/30 text-white">
              {PROPERTY_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-brand-magenta/20">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Bedrooms</label>
          <Select value={form.bedrooms} onValueChange={(v) => setForm((f) => ({ ...f, bedrooms: v }))}>
            <SelectTrigger data-testid="quote-bedrooms" className={inputCls + " h-[46px]"}>
              <SelectValue placeholder="How many?" />
            </SelectTrigger>
            <SelectContent className="bg-panel2 border-brand-magenta/30 text-white">
              {BEDROOM_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-brand-magenta/20">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Bathrooms</label>
          <Select value={form.bathrooms} onValueChange={(v) => setForm((f) => ({ ...f, bathrooms: v }))}>
            <SelectTrigger data-testid="quote-bathrooms" className={inputCls + " h-[46px]"}>
              <SelectValue placeholder="How many?" />
            </SelectTrigger>
            <SelectContent className="bg-panel2 border-brand-magenta/30 text-white">
              {BATHROOM_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-brand-magenta/20">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Street address *</label>
          <input data-testid="quote-street-address" className={inputCls} placeholder="123 Main Street NW" value={form.street_address} onChange={set("street_address")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">City *</label>
          <input data-testid="quote-city" className={inputCls} placeholder="Edmonton" value={form.city} onChange={set("city")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Province</label>
          <Select value={form.province} onValueChange={(v) => setForm((f) => ({ ...f, province: v }))}>
            <SelectTrigger data-testid="quote-province" className={inputCls + " h-[46px]"}>
              <SelectValue placeholder="Choose province" />
            </SelectTrigger>
            <SelectContent className="bg-panel2 border-brand-magenta/30 text-white">
              {PROVINCE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="focus:bg-brand-magenta/20">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Postal code *</label>
          <input data-testid="quote-postal-code" className={inputCls} placeholder="T6H 5Z5" value={form.postal_code} onChange={set("postal_code")} />
        </div>
        {!compact && (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-pink">Anything else?</label>
            <textarea data-testid="quote-message" rows={3} className={inputCls} placeholder="Number of bedrooms, special requests, pets…" value={form.message} onChange={set("message")} />
          </div>
        )}
      </div>

      <button
        data-testid="quote-submit-btn"
        type="submit"
        disabled={loading}
        className="brand-gradient-bg mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-magenta/30 transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        {loading ? "Sending…" : "Get My Free Quote"}
      </button>
      <p className="mt-3 text-center text-xs text-white/40">No obligation · Free estimate · We reply within 1 business day</p>
    </form>
  );
}
