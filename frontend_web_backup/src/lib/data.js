export const BRAND = {
  name: "Tidyups Cleaning Service",
  shortName: "Tidyups",
  tagline: "Leave The Mess To Us!",
  phonePrimary: "(780) 718-5092",
  phonePrimaryHref: "tel:+17807185092",
  phoneToll: "(833) TIDY-UPS",
  phoneTollHref: "tel:+18338439877",
  email: "info@tidyupscleaning.com",
  website: "tidyupscleaning.com",
  address: "6510 Gateway Boulevard, Suite 1020, Edmonton, AB T6H 5Z5",
  mapUrl: "https://maps.app.goo.gl/cLfsewqhC3ppnPkL8",
  logo: "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/97bcjnmh_Tidyups%20Cleanin%20Logo%20V3%202026_edited.png",
  banner: "https://customer-assets.emergentagent.com/job_tidyups-quote/artifacts/j5vvr2zn_Tidyups%20Banner%202026%20V3_edited.jpg",
  hours: [
    { d: "Mon – Fri", h: "8:00 AM – 6:00 PM" },
    { d: "Saturday", h: "9:00 AM – 4:00 PM" },
    { d: "Sunday", h: "Closed" },
  ],
};

export const IMAGES = {
  livingRoom: "https://images.unsplash.com/photo-1632829882891-5047ccc421bc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  livingRoom2: "https://images.unsplash.com/photo-1628744876497-eb30460be9f6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  kitchen: "https://images.unsplash.com/photo-1665507279638-5b48073c637b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  supplies: "https://images.unsplash.com/photo-1563453392212-326f5e854473?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  office: "https://images.unsplash.com/photo-1556761175-4b46a572b786?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
  bathroom: "https://images.unsplash.com/photo-1661107259637-4e1c55462428?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400",
};

export const SERVICES = [
  { key: "home", title: "Home Cleaning", desc: "Comprehensive residential cleaning that leaves every room spotless.", icon: "Home" },
  { key: "recurring", title: "Recurring Cleaning", desc: "Weekly, bi-weekly or monthly plans to keep your space consistently tidy.", icon: "CalendarClock" },
  { key: "deep", title: "Deep Cleaning", desc: "Intensive top-to-bottom clean reaching every corner and crevice.", icon: "Sparkles" },
  { key: "moveout", title: "Move-Out Cleaning", desc: "Full clean to secure your deposit and impress landlords.", icon: "Truck" },
  { key: "movein", title: "Move-In Cleaning", desc: "Start fresh in a brand-new, thoroughly sanitized home.", icon: "KeyRound" },
  { key: "commercial", title: "Commercial & Office", desc: "Professional maintenance for offices and businesses of all sizes.", icon: "Building2" },
  { key: "airbnb", title: "Airbnb Turnover", desc: "Fast, reliable short-term rental turnovers between guests.", icon: "BedDouble" },
  { key: "postconstruction", title: "Post-Construction", desc: "Detailed removal of dust and debris after any renovation.", icon: "HardHat" },
  { key: "eco", title: "Eco-Friendly Clean", desc: "Green cleaning with non-toxic, family & pet-safe products.", icon: "Leaf" },
];

export const FEATURES = [
  { title: "Insured & Bonded", desc: "Full coverage for total peace of mind.", icon: "ShieldCheck" },
  { title: "Eco-Friendly", desc: "Safe, non-toxic products on request.", icon: "Leaf" },
  { title: "Always Punctual", desc: "We show up on time, every single time.", icon: "Clock" },
  { title: "Vetted Pros", desc: "Background-checked, trained cleaners.", icon: "BadgeCheck" },
];

export const STATS = [
  { value: "2000+", label: "Happy Clients" },
  { value: "15+", label: "Years Experience" },
  { value: "5.0", label: "Average Rating" },
  { value: "100%", label: "Satisfaction" },
];

export const TESTIMONIALS = [
  { name: "Sarah Johnson", role: "Homeowner", quote: "Tidyups transformed my home! Their attention to detail is incredible and the team is always professional and friendly." },
  { name: "Michael Chen", role: "Business Owner", quote: "We've used Tidyups for our office for over a year. Reliable, thorough — our workspace has never looked better." },
  { name: "Emily Rodriguez", role: "Property Manager", quote: "I trust Tidyups for all our move-in/move-out cleanings. They consistently exceed expectations." },
];

export const GALLERY = [
  { src: IMAGES.kitchen, label: "Kitchen Cleaning" },
  { src: IMAGES.bathroom, label: "Bathroom Deep Clean" },
  { src: IMAGES.livingRoom, label: "Living Spaces" },
  { src: IMAGES.office, label: "Office Cleaning" },
  { src: IMAGES.livingRoom2, label: "Move-In Ready" },
  { src: IMAGES.supplies, label: "Eco Supplies" },
];

export const FAQS = [
  { q: "How do I book a cleaning service?", a: "Just fill out the free quote form above or call us at (780) 718-5092. We'll confirm your details, give you a transparent price, and schedule a time that works for you." },
  { q: "Do you bring your own cleaning supplies?", a: "Yes! Our team arrives fully equipped with professional-grade equipment and supplies. We also offer eco-friendly, non-toxic products on request at no extra charge." },
  { q: "Do I need to be home during the cleaning?", a: "Not at all. Many clients provide access instructions and go about their day. Our cleaners are background-checked, insured, and bonded for your peace of mind." },
  { q: "What if I'm not satisfied with the cleaning?", a: "Your satisfaction is guaranteed. If anything isn't up to standard, let us know within 24 hours and we'll come back to make it right — free of charge." },
  { q: "How long does a typical cleaning take?", a: "It depends on the size and condition of your space. A standard home clean takes 2–4 hours, while deep or move-out cleans can take longer. We'll estimate this in your quote." },
  { q: "Which areas do you serve?", a: "We proudly serve Edmonton and the surrounding areas. Not sure if you're in our zone? Reach out and we'll let you know right away." },
];

export const SERVICE_OPTIONS = SERVICES.map((s) => s.title).concat(["Other / Not Sure"]);
export const PROPERTY_OPTIONS = ["House", "Apartment / Condo", "Office", "Airbnb / Rental", "Commercial Space", "Other"];
export const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4", "5", "6+"];
export const BATHROOM_OPTIONS = ["1", "1.5", "2", "2.5", "3", "4", "5+"];
export const PROVINCE_OPTIONS = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
  "Quebec", "Saskatchewan", "Yukon",
];

// Resolve a site-image url that may be absolute (external) or a backend-relative path.
export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${process.env.REACT_APP_BACKEND_URL}${url}`;
};
