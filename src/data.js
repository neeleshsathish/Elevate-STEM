// All site content lives here, so most edits never touch the page code.

export const DISCORD = "https://discord.gg/ymrERFS4Et";
export const INSTAGRAM = "https://www.instagram.com/elevatestem/";

export const DONATE_URL = "https://hcb.hackclub.com/donations/start/elevate-stem";

export const STATS = [
  { value: "1,050+", label: "community members" },
  { value: "375K+", label: "views on Instagram" },
  { value: "10+", label: "workshops hosted" },
  { value: "20+", label: "partner organizations" },
  { value: "100+", label: "STEM kits donated" },
];

// slug = the URL (/resources/<slug>) and the file names in public/guides and public/covers.
export const GUIDES = [
  {
    slug: "pathway-to-research",
    title: "Pathway to Research",
    tag: "Research",
    pages: 1,
    blurb: "The route from a broad interest to a research question, experiments, and results.",
  },
  {
    slug: "research-paper-guide",
    title: "How to Write a Research Paper",
    tag: "Research",
    pages: 2,
    blurb: "Introduction, methods, results, and discussion, explained one section at a time.",
  },
  {
    slug: "literature-review-guide",
    title: "Literature Review Guide",
    tag: "Research",
    pages: 1,
    blurb: "How to find papers, pull out what matters, and frame your own project around them.",
  },
  {
    slug: "cold-email-template",
    title: "Cold Email Template",
    tag: "Outreach",
    pages: 1,
    blurb: "A ready-to-edit email, with a subject line, for asking a professor about lab opportunities.",
  },
  {
    slug: "grant-writing-guide",
    title: "Grant Writing Guide",
    tag: "Funding",
    pages: 4,
    blurb: "The parts of a grant proposal, tips, common mistakes, and a template you can adapt.",
  },
  {
    slug: "cv-template",
    title: "Curriculum Vitae Template",
    tag: "College & career",
    pages: 1,
    blurb: "A student CV with the sections already laid out. Fill in your own experience.",
  },
  {
    slug: "brag-sheet",
    title: "Student Brag Sheet",
    tag: "College & career",
    pages: 3,
    blurb: "Hand this to teachers writing your recommendation letters so they know what to highlight.",
  },
  {
    slug: "science-fair-poster",
    title: "Science Fair Poster Template",
    tag: "Science fair",
    pages: 1,
    blurb: "A trifold poster layout with every standard section in place.",
  },
  {
    slug: "quad-chart",
    title: "Quad Chart Template",
    tag: "Science fair",
    pages: 1,
    blurb: "Sum up a whole project on one slide: question, method, results, and takeaways.",
  },
];

// Paths go through BASE_URL so the site also works when hosted in a subfolder.
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export const guideFile = (g) => asset(`guides/${g.slug}.pdf`);
export const guideCover = (g) => asset(`covers/${g.slug}.webp`);
export const guideDownloadName = (g) => `Elevate STEM - ${g.title}.pdf`;

export const TEAM = [
  {
    name: "Neelesh Sathish",
    role: "Founder & Executive Director",
    photo: "team/neelesh-sathish.jpg",
    initials: "NS",
    bio: "Neelesh started Elevate STEM to make STEM education and research opportunities available to every student, whatever their background. He has grown it into a 1,050+ member community with 10+ workshops, 100+ STEM kits donated, and 20+ partner organizations.",
  },
  {
    name: "Aayush Grover",
    role: "Co-Founder & Workshop Director",
    photo: "team/aayush-grover.jpg", // add a photo to public/team/ and put "team/<file>" here
    initials: "AG",
    bio: "Aayush co-founded Elevate STEM and runs its workshops, bringing in researchers, professors, and college students to talk with our community about research and college.",
  },
];

export const PARTNERS = [
  {
    name: "EduVisa",
    blurb: "501(c)(3) tutoring and college mentoring organization with 100+ tutors, AMAs, and volunteer opportunities.",
    links: [
      { label: "Website", href: "https://myeduvisa.org/" },
      { label: "Discord", href: "https://discord.gg/9aFBhgf" },
    ],
  },
  {
    name: "CompetifyHub",
    blurb: "Free math competition resources used by thousands of competitors every month.",
    links: [
      { label: "Website", href: "https://competifyhub.com" },
      { label: "Discord", href: "https://discord.gg/UAMTuU9d8Z" },
    ],
  },
  {
    name: "APStudy",
    blurb: "AP course overviews, study tips, and a community for students taking advanced classes.",
    links: [
      { label: "Website", href: "https://apstudy.org/" },
      { label: "Discord", href: "https://discord.gg/XaxgdsZ4Ht" },
    ],
  },
  {
    name: "B.O.O.S.T.",
    blurb: "Student-run organization hosting STEM workshops and competitions.",
    links: [{ label: "Discord", href: "https://discord.gg/W6RywdKAmh" }],
  },
  {
    name: "Infinity Squared Mathematics",
    blurb: "501(c)(3) running free math competitions with $2,000+ in prizes, lectures, and weekly problems.",
    links: [
      { label: "Website", href: "https://www.infinitysquaredmathematics.org/" },
      { label: "Discord", href: "https://discord.gg/dqjrMmNaS6" },
    ],
  },
  {
    name: "StudyQuest",
    blurb: "Free academic hub with 40+ AP guides, SAT prep, essay tips, and a passion project generator.",
    links: [{ label: "Discord", href: "https://discord.gg/jXBfmU7QHU" }],
  },
  {
    name: "Lunar Community",
    blurb: "501(c)(3) running math and physics olympiads with $2,500+ in prizes, partnered with AoPS and Wolfram.",
    links: [
      { label: "Website", href: "https://cuddly-part-971010.framer.app/" },
      { label: "Discord", href: "https://discord.gg/VQVXGAS8nk" },
    ],
  },
  {
    name: "NeuraVia",
    blurb: "Global youth initiative building AI tools for early neurological diagnosis. $20K+ funded and recruiting.",
    links: [{ label: "Discord", href: "https://discord.gg/pvcAepJQBH" }],
  },
];

// Competitions are hidden for now. To bring the page back, re-add the /competitions
// route in App.jsx and the links in Header.jsx and Footer.jsx.
export const COMPETITION = {
  name: "STEMvision 2025",
  status: "closed", // "open" turns the submit button back on
  submitUrl: "https://forms.gle/Z2ZMXycnbTcL5NxNA",
  prizePool: "$225+",
  teamSize: "Up to 4",
  entryFee: "$10 per person",
  prizes: [
    { place: "1st place", amount: "$100" },
    { place: "2nd place", amount: "$75" },
    { place: "3rd place", amount: "$50" },
  ],
  rubric: [
    ["Technical skill & execution", 25],
    ["Creativity & originality", 20],
    ["Innovation & practicality", 20],
    ["Research & documentation", 15],
    ["Impact & contribution", 15],
    ["Presentation & communication", 5],
  ],
};

// "Our impact so far" photo strip on the homepage. Files live in public/impact/.
// Order here is the order in the slider.
export const IMPACT = [
  // kind sets the frame: photo, call (video call), screen (app window), phone, doc (paper)
  // r = frame width / height
  { src: "impact/school-visit.webp", w: 1191, sw: 794, kind: "photo", r: 1.32, caption: "Handing out STEM kits to students on a school visit" },
  { src: "impact/workshop-prof-kev.webp", w: 1604, sw: 1084, kind: "photo", r: 1.806, caption: "Neelesh interviewing Prof Kev in a live workshop" },
  { src: "impact/kit-contents.webp", w: 758, sw: 505, kind: "photo", r: 0.84, caption: "Inside one kit: a motor, fan, bulb, switch, and wires for building circuits" },
  { src: "impact/workshop-questions.webp", w: 1180, sw: 708, kind: "screen", app: "Discord", r: 1.1, caption: "Students sending in questions for a workshop speaker" },
  { src: "impact/kits-box.webp", w: 634, sw: 423, kind: "photo", r: 0.7, caption: "A box of science kits packed and ready to send" },
  { src: "impact/white-house-letter.webp", w: 738, sw: 403, kind: "doc", r: 0.92, caption: "A letter from the White House recognizing Elevate STEM, July 2026" },
  { src: "impact/workshop-speaker.webp", w: 1582, sw: 949, kind: "call", r: 1.56, caption: "A guest speaker workshop for our community" },
  { src: "impact/instagram.webp", w: 621, sw: 339, kind: "phone", r: 0.53, caption: "18.6K followers and 375K+ views on Instagram" },
  { src: "impact/school-meeting.webp", w: 779, sw: 519, kind: "photo", r: 0.87, caption: "Meeting with school staff about bringing kits to their students" },
  { src: "impact/partner-announcement.webp", w: 1584, sw: 950, kind: "screen", app: "Discord", r: 1.45, caption: "Partner servers sharing our admissions talk with a Harvard alum" },
  { src: "impact/discord-advice.webp", w: 1181, sw: 709, kind: "screen", app: "Discord", r: 1.1, caption: "Students helping each other plan their classes in our Discord" },
];

// Cards that orbit the atom in the homepage 3D scene (same colors as the "What we do" cards).
// The places on the homepage atom. Each one is an electron you can click.
// color = label background, orb = the electron sphere
// The curved cards that ring the homepage atom; each one opens a place on the site.
export const HUB_CARDS = [
  { id: "guides", title: "Free guides", kicker: "9 guides", text: "Research, college, and outreach", color: "#c6efb8", doodle: "guides", to: "/resources" },
  { id: "impact", title: "Our impact", kicker: "Photos", text: "Kits, workshops, and more", color: "#b9e6d3", doodle: "impact", to: "#impact" },
  { id: "team", title: "Team", kicker: "Who we are", text: "Meet the people behind it", color: "#e5f5c6", doodle: "team", to: "/team" },
  { id: "partners", title: "Partners", kicker: "Our network", text: "Student nonprofits we work with", color: "#bfd3f6", doodle: "partners", to: "/partners" },
  { id: "donate", title: "Donate", kicker: "100+ STEM kits", text: "Send science kits to kids", color: "#f7e7d8", doodle: "donate", to: "/donate" },
  { id: "discord", title: "Discord", kicker: "1,050+ members", text: "Join the community", color: "#cdd8fb", doodle: "discord", href: "https://discord.gg/ymrERFS4Et" },
  { id: "instagram", title: "Instagram", kicker: "375K+ views", text: "Follow @elevatestem", color: "#f6d9cf", doodle: "instagram", href: "https://www.instagram.com/elevatestem/" },
];
