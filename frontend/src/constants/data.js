export const CONTACT = {
  phoneDisplay: '(780) 718-5092',
  phoneTel: 'tel:+17807185092',
  tollFreeDisplay: '(833) TIDY-UPS',
  tollFreeSub: '+1 (833) 843-9877',
  tollFreeTel: 'tel:+18338439877',
  address: '6510 Gateway Boulevard Suite 1020',
  cityLine: 'Edmonton, AB T6H 5Z5',
  mapsUrl: 'https://maps.google.com/?q=6510+Gateway+Boulevard+Suite+1020,+Edmonton,+AB+T6H+5Z5',
  website: 'tidyupscleaning.com',
  websiteUrl: 'https://tidyupscleaning.com',
  hours: [
    { day: 'Monday – Friday', time: '8:00 AM – 6:00 PM' },
    { day: 'Saturday', time: '9:00 AM – 4:00 PM' },
    { day: 'Sunday', time: 'Closed' },
  ],
};

export const SERVICES = [
  { name: 'Home Cleaning', icon: 'home-heart', desc: 'Top-to-bottom cleaning for houses, condos & apartments.' },
  { name: 'Recurring Cleaning', icon: 'calendar-refresh', desc: 'Weekly or bi-weekly visits that keep your place spotless.' },
  { name: 'Deep Cleaning', icon: 'broom', desc: 'Intensive scrub of every corner, baseboard & fixture.' },
  { name: 'Move-Out Cleaning', icon: 'package-variant-closed', desc: 'Get your full damage deposit back, guaranteed shine.' },
  { name: 'Move-In Cleaning', icon: 'key-variant', desc: 'Start fresh — a sanitized, sparkling new home awaits.' },
  { name: 'Commercial & Office', icon: 'office-building-outline', desc: 'Professional spaces kept pristine for staff & clients.' },
  { name: 'Airbnb Turnover', icon: 'bed-king-outline', desc: 'Fast, reliable turnovers that earn 5-star reviews.' },
  { name: 'Post-Construction', icon: 'hammer-wrench', desc: 'Dust, debris & residue gone after any renovation.' },
  { name: 'Eco-Friendly Clean', icon: 'leaf', desc: 'Green products that are safe for kids, pets & the planet.' },
];

export const SERVICE_OPTIONS = [...SERVICES.map((s) => s.name), 'Other / Not Sure'];

export const PROPERTY_TYPES = ['House', 'Apartment / Condo', 'Office', 'Airbnb / Rental', 'Commercial Space', 'Other'];

export const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6+'];

export const BATHROOM_OPTIONS = ['1', '1.5', '2', '2.5', '3', '4', '5+'];

export const PROVINCES = ['Alberta', 'British Columbia', 'Saskatchewan', 'Manitoba', 'Ontario', 'Quebec', 'New Brunswick', 'Nova Scotia', 'PEI', 'Newfoundland and Labrador', 'Yukon', 'Northwest Territories', 'Nunavut'];

export const STATS = [
  { value: '2000+', label: 'Happy Clients' },
  { value: '15+', label: 'Years Experience' },
  { value: '5.0', label: 'Star Rating' },
];

export const TRUST_BADGES = [
  { icon: 'shield-check', label: 'Insured & Bonded' },
  { icon: 'leaf', label: 'Eco-Friendly' },
  { icon: 'star-circle', label: 'Satisfaction Guaranteed' },
];

export const WHY_US = [
  { icon: 'shield-check', title: 'Insured & Bonded', desc: 'Fully covered professionals you can trust in your space.' },
  { icon: 'leaf', title: 'Eco-Friendly Products', desc: 'Safe for kids, pets and the planet — no harsh residue.' },
  { icon: 'clock-fast', title: 'On Time, Every Time', desc: 'Reliable scheduling that fits around your life.' },
  { icon: 'star-shooting', title: 'Satisfaction Guaranteed', desc: "Not happy? We'll come back and make it right." },
];

export const TESTIMONIALS = [
  { name: 'Sarah M.', area: 'Edmonton', text: 'Absolutely spotless! The team was friendly, fast, and my condo has never looked better.' },
  { name: 'Jason T.', area: 'Sherwood Park', text: 'They handled our move-out clean and we got our full damage deposit back. Lifesavers!' },
  { name: 'Priya K.', area: 'Edmonton', text: 'Booked a recurring bi-weekly clean. Reliable every single time. Highly recommend Tidyups.' },
];
