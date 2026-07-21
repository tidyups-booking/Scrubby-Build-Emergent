import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import {
  Phone, Menu, X, Star, MapPin, Clock, Mail, ArrowUpRight, Sparkles, Check,
} from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { BRAND, IMAGES, SERVICES, FEATURES, STATS, TESTIMONIALS, GALLERY, FAQS, resolveImageUrl } from "@/lib/data";
import QuoteForm from "@/components/QuoteForm";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
};

const Section = ({ children, className = "", id }) => (
  <section id={id} className={`relative mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>
    {children}
  </section>
);

function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  const links = [
    { l: "Services", h: "#services" },
    { l: "Why Us", h: "#why" },
    { l: "Gallery", h: "#gallery" },
    { l: "Reviews", h: "#reviews" },
    { l: "Contact", h: "#contact" },
  ];
  return (
    <header
      data-testid="navbar"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "glass py-2" : "bg-transparent py-4"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" data-testid="logo-link" className="flex items-center gap-3">
          <img src={BRAND.logo} alt="Tidyups Cleaning" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-magenta/40 sm:h-14 sm:w-14" />
          <span className="font-display text-lg font-extrabold leading-none">
            <span className="brand-gradient-text">Tidyups</span>
            <span className="block text-[10px] font-medium tracking-widest text-white/50">CLEANING SERVICE INC</span>
          </span>
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          {links.map((x) => (
            <a key={x.l} href={x.h} data-testid={`nav-${x.l.toLowerCase().replace(" ", "-")}`} className="text-sm font-semibold text-white/70 transition-colors hover:text-brand-pink">
              {x.l}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href={BRAND.phonePrimaryHref} data-testid="nav-call-btn" className="hidden items-center gap-2 rounded-full border border-brand-magenta/40 px-4 py-2 text-sm font-bold text-brand-pink transition-colors hover:bg-brand-magenta/10 sm:flex">
            <Phone className="h-4 w-4" /> {BRAND.phonePrimary}
          </a>
          <a href="#quote" data-testid="nav-quote-btn" className="brand-gradient-bg hidden rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-magenta/30 transition-transform hover:scale-105 sm:inline-block">
            Free Quote
          </a>
          <button data-testid="mobile-menu-btn" onClick={() => setOpen(!open)} className="rounded-full border border-white/15 p-2 lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="glass mx-5 mt-2 rounded-2xl p-4 lg:hidden" data-testid="mobile-menu">
          {links.map((x) => (
            <a key={x.l} href={x.h} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-semibold text-white/80">{x.l}</a>
          ))}
          <a href={BRAND.phonePrimaryHref} className="mt-2 flex items-center gap-2 text-sm font-bold text-brand-pink"><Phone className="h-4 w-4" /> {BRAND.phonePrimary}</a>
          <a href="#quote" onClick={() => setOpen(false)} className="brand-gradient-bg mt-3 block rounded-full px-5 py-3 text-center text-sm font-bold text-white">Get Free Quote</a>
        </div>
      )}
    </header>
  );
}

function Hero({ heroUrl }) {
  const img = heroUrl ? resolveImageUrl(heroUrl) : IMAGES.livingRoom;
  return (
    <div id="top" className="relative overflow-hidden pt-28 sm:pt-36">
      <div className="aurora pointer-events-none absolute inset-0 -z-10" />
      <div className="grain pointer-events-none absolute inset-0 -z-10 opacity-[0.04]" />
      <Section className="grid items-center gap-12 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24">
        <div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="inline-flex items-center gap-2 rounded-full border border-brand-magenta/30 bg-brand-magenta/10 px-4 py-1.5 text-xs font-semibold text-brand-pink">
            <Star className="h-3.5 w-3.5 fill-brand-gold text-brand-gold" /> Edmonton's #1 Rated Cleaning Service
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1} className="font-display mt-5 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">
            Sparkling spaces,<br />
            <span className="brand-gradient-text">zero hassle.</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-6 max-w-xl text-base text-white/65 sm:text-lg">
            Professional residential &amp; commercial cleaning across Edmonton — from deep cleans to move-outs.
            Trusted, background-checked pros who show up on time. <span className="font-semibold text-white">Leave the mess to us.</span>
          </motion.p>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#quote" data-testid="hero-quote-btn" className="brand-gradient-bg flex items-center gap-2 rounded-full px-7 py-4 text-base font-bold text-white shadow-xl shadow-brand-magenta/30 transition-transform hover:scale-105">
              Get Your Free Quote <ArrowUpRight className="h-5 w-5" />
            </a>
            <a href={BRAND.phonePrimaryHref} data-testid="hero-call-btn" className="flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 text-base font-bold text-white transition-colors hover:border-brand-pink hover:text-brand-pink">
              <Phone className="h-5 w-5" /> {BRAND.phonePrimary}
            </a>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {["Insured & Bonded", "Eco-Friendly", "Satisfaction Guaranteed"].map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-sm text-white/60"><Check className="h-4 w-4 text-brand-pink" /> {t}</span>
            ))}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative">
          <div className="animate-floaty relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-brand-violet/30">
            <img src={img} alt="Tidyups Cleaning" data-testid="hero-image" className="h-[420px] w-full object-cover sm:h-[520px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          </div>
          <div className="glass absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl sm:-left-6">
            <div className="brand-gradient-bg flex h-11 w-11 items-center justify-center rounded-full"><Sparkles className="h-5 w-5 text-white" /></div>
            <div>
              <p className="font-display text-xl font-extrabold leading-none">2000+</p>
              <p className="text-xs text-white/60">Happy Edmonton clients</p>
            </div>
          </div>
          <div className="glass absolute -right-2 top-6 flex items-center gap-1 rounded-2xl px-4 py-2.5 shadow-xl sm:-right-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-brand-gold text-brand-gold" />)}
            <span className="ml-1 text-sm font-bold">5.0</span>
          </div>
        </motion.div>
      </Section>

      <Marquee />
    </div>
  );
}

function Marquee() {
  const items = ["Deep Cleaning", "Move-Out", "Airbnb Turnover", "Eco-Friendly", "Office Cleaning", "Recurring Plans", "Post-Construction", "Insured & Bonded"];
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-panel/60 py-4">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-3 font-display text-sm font-bold uppercase tracking-widest text-white/45">
            <Sparkles className="h-4 w-4 text-brand-magenta" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function LucideIcon({ name, className }) {
  const C = Icons[name] || Icons.Sparkles;
  return <C className={className} />;
}

function Services() {
  return (
    <Section id="services" className="py-20 lg:py-28">
      <div className="mb-14 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-pink">Our Services</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Cleaning solutions for every need</h2>
        <p className="mt-4 text-white/60">Whatever your space, we have a tailored clean for it — spotless results, every time.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => (
          <motion.a
            key={s.key}
            href="#quote"
            data-testid={`service-card-${s.key}`}
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} custom={i % 3}
            className="card-glow group relative overflow-hidden rounded-3xl border border-white/10 bg-panel/70 p-7"
          >
            <div className="brand-gradient-bg mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
              <LucideIcon name={s.icon} className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-display text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-sm text-white/60">{s.desc}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-pink opacity-0 transition-opacity group-hover:opacity-100">
              Get a quote <ArrowUpRight className="h-4 w-4" />
            </span>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}

function Why({ whyUrl }) {
  const img = whyUrl ? resolveImageUrl(whyUrl) : IMAGES.supplies;
  return (
    <Section id="why" className="py-20 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-[2rem] border border-white/10">
            <img src={img} alt="Why choose Tidyups" data-testid="why-image" className="h-[460px] w-full object-cover" />
          </div>
          <div className="glass absolute -right-3 bottom-8 rounded-2xl px-6 py-4 text-center shadow-xl">
            <p className="font-display text-3xl font-extrabold brand-gradient-text">15+</p>
            <p className="text-xs text-white/60">Years of experience</p>
          </div>
        </motion.div>
        <div className="order-1 lg:order-2">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-pink">Why Tidyups</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Reliable, detailed &amp; done right</h2>
          <p className="mt-4 text-white/60">
            We communicate clearly, work efficiently, and take pride in a spotless finish — every single time.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                className="rounded-2xl border border-white/10 bg-panel/70 p-5">
                <LucideIcon name={f.icon} className="h-7 w-7 text-brand-pink" />
                <h3 className="font-display mt-3 text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-white/55">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function Stats() {
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-panel/50 py-14">
      <div className="aurora pointer-events-none absolute inset-0 opacity-60" />
      <Section className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} className="text-center">
            <p className="font-display text-4xl font-extrabold brand-gradient-text sm:text-5xl">{s.value}</p>
            <p className="mt-2 text-sm font-medium text-white/60">{s.label}</p>
          </motion.div>
        ))}
      </Section>
    </div>
  );
}

function Gallery({ items }) {
  const list = (items && items.length ? items.map((g) => ({ src: resolveImageUrl(g.url), label: g.label })) : GALLERY);
  return (
    <Section id="gallery" className="py-20 lg:py-28">
      <div className="mb-12 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-pink">Our Work</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">See the transformation</h2>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {list.map((g, i) => (
          <motion.div key={g.label + i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i % 3}
            data-testid={`gallery-item-${i}`}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
            <img src={g.src} alt={g.label} className="h-52 w-full object-cover transition-transform duration-700 group-hover:scale-110 sm:h-64" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
            <p className="font-display absolute bottom-4 left-4 text-lg font-bold text-white">{g.label}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Reviews() {
  return (
    <Section id="reviews" className="py-20 lg:py-28">
      <div className="mb-12 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-pink">Reviews</p>
        <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Loved by thousands of clients</h2>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={t.name} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
            data-testid={`review-${i}`}
            className="card-glow rounded-3xl border border-white/10 bg-panel/70 p-7">
            <div className="flex gap-1">{[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4 fill-brand-gold text-brand-gold" />)}</div>
            <p className="mt-4 text-white/75">“{t.quote}”</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="brand-gradient-bg flex h-11 w-11 items-center justify-center rounded-full font-display text-lg font-bold text-white">{t.name[0]}</div>
              <div>
                <p className="font-display font-bold">{t.name}</p>
                <p className="text-xs text-white/50">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function QuoteSection() {
  return (
    <Section id="quote" className="py-20 lg:py-28">
      <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-pink">Free Quote</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Tell us about your space</h2>
          <p className="mt-4 text-white/60">
            Fill out the form and our team will get back to you within one business day with a transparent, no-obligation quote.
            Prefer to talk? Call us anytime.
          </p>
          <div className="mt-8 space-y-3">
            <a href={BRAND.phonePrimaryHref} className="glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-brand-pink/50">
              <div className="brand-gradient-bg flex h-11 w-11 items-center justify-center rounded-full"><Phone className="h-5 w-5 text-white" /></div>
              <div><p className="text-xs text-white/50">Call us</p><p className="font-display font-bold">{BRAND.phonePrimary}</p></div>
            </a>
            <a href={BRAND.phoneTollHref} className="glass flex items-center gap-4 rounded-2xl p-4 transition-colors hover:border-brand-pink/50">
              <div className="brand-gradient-bg flex h-11 w-11 items-center justify-center rounded-full"><Phone className="h-5 w-5 text-white" /></div>
              <div><p className="text-xs text-white/50">Toll-free</p><p className="font-display font-bold">{BRAND.phoneToll}</p></div>
            </a>
          </div>
        </div>
        <QuoteForm />
      </div>
    </Section>
  );
}

function FAQ() {
  return (
    <Section className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-pink">FAQ</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">Questions, answered</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} data-testid={`faq-${i}`} className="overflow-hidden rounded-2xl border border-white/10 bg-panel/70 px-5">
              <AccordionTrigger className="py-5 text-left font-display text-base font-bold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-white/65">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section id="contact" className="py-16 lg:py-24">
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { icon: MapPin, t: "Our Location", v: BRAND.address, href: BRAND.mapUrl, cta: "Get directions" },
          { icon: Phone, t: "Contact Us", v: `${BRAND.phonePrimary} · ${BRAND.phoneToll}`, href: BRAND.phonePrimaryHref, cta: "Call now" },
          { icon: Clock, t: "Business Hours", list: BRAND.hours },
        ].map((c, i) => (
          <div key={i} data-testid={`contact-${i}`} className="glass rounded-3xl p-7">
            <div className="brand-gradient-bg mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"><c.icon className="h-6 w-6 text-white" /></div>
            <h3 className="font-display text-lg font-bold">{c.t}</h3>
            {c.list ? (
              <ul className="mt-3 space-y-1.5 text-sm text-white/60">
                {c.list.map((h) => <li key={h.d} className="flex justify-between gap-4"><span>{h.d}</span><span className="text-white/80">{h.h}</span></li>)}
              </ul>
            ) : (
              <>
                <p className="mt-3 text-sm text-white/60">{c.v}</p>
                <a href={c.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-pink">{c.cta} <ArrowUpRight className="h-4 w-4" /></a>
              </>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-panel/40">
      <div className="aurora pointer-events-none absolute inset-0 opacity-40" />
      <Section className="relative py-14">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <img src={BRAND.logo} alt="Tidyups" className="h-16 w-16 rounded-full object-cover ring-2 ring-brand-magenta/40" />
            <div>
              <p className="font-display text-xl font-extrabold"><span className="brand-gradient-text">Tidyups</span> Cleaning</p>
              <p className="text-sm text-white/50">{BRAND.tagline}</p>
            </div>
          </div>
          <a href="#quote" className="brand-gradient-bg rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-magenta/30 transition-transform hover:scale-105">Get Your Free Quote</a>
        </div>
        <div className="mt-10 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Tidyups Cleaning Service Inc. · Edmonton, AB</p>
          <div className="flex gap-6">
            <a href={BRAND.phonePrimaryHref} className="hover:text-brand-pink">{BRAND.phonePrimary}</a>
            <span>{BRAND.website}</span>
            <Link to="/privacy" data-testid="footer-privacy-link" className="hover:text-brand-pink">Privacy Policy</Link>
          </div>
        </div>
      </Section>
    </footer>
  );
}

export default function Landing() {
  const [heroUrl, setHeroUrl] = useState(null);
  const [whyUrl, setWhyUrl] = useState(null);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    axios.get(`${API}/site-images`).then((res) => {
      setHeroUrl(res.data.hero?.url || null);
      setWhyUrl(res.data.why?.url || null);
      setGallery(res.data.gallery || []);
    }).catch(() => {});
  }, []);

  return (
    <main>
      <Navbar />
      <Hero heroUrl={heroUrl} />
      <Services />
      <Why whyUrl={whyUrl} />
      <Stats />
      <Gallery items={gallery} />
      <Reviews />
      <QuoteSection />
      <FAQ />
      <Contact />
      <Footer />
    </main>
  );
}
