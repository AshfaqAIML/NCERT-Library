import { PrismaClient } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// Content generators
// ---------------------------------------------------------------------------

const SUBJECTS = [
  { name: "History", slug: "history", color: "amber", icon: "Landmark", sortOrder: 1, description: "Ancient, medieval & modern Indian history — the backbone of UPSC preparation." },
  { name: "Geography", slug: "geography", color: "emerald", icon: "Globe2", sortOrder: 2, description: "Physical, human & Indian geography covering the earth, climate and resources." },
  { name: "Polity", slug: "polity", color: "rose", icon: "Scale", sortOrder: 3, description: "Constitution, governance, rights & the working of Indian democracy." },
  { name: "Economics", slug: "economics", color: "violet", icon: "TrendingUp", sortOrder: 4, description: "Micro & macroeconomics, public finance and the Indian economy." },
  { name: "Science", slug: "science", color: "sky", icon: "FlaskConical", sortOrder: 5, description: "General science fundamentals across physics, chemistry & biology." },
  { name: "Biology", slug: "biology", color: "emerald", icon: "Dna", sortOrder: 6, description: "Life processes, cells, genetics, plants & human physiology." },
  { name: "Chemistry", slug: "chemistry", color: "sky", icon: "Atom", sortOrder: 7, description: "Matter, reactions, organic & inorganic chemistry foundations." },
  { name: "Physics", slug: "physics", color: "violet", icon: "Rocket", sortOrder: 8, description: "Motion, energy, electricity, optics & modern physics." },
  { name: "Mathematics", slug: "mathematics", color: "amber", icon: "Sigma", sortOrder: 9, description: "Numbers, algebra, geometry, calculus & statistics." },
  { name: "Environment", slug: "environment", color: "emerald", icon: "Leaf", sortOrder: 10, description: "Ecology, biodiversity, climate change & conservation." },
  { name: "Art & Culture", slug: "art-culture", color: "rose", icon: "Palette", sortOrder: 11, description: "Indian art, architecture, music, dance & literary heritage." },
  { name: "Social Science", slug: "social-science", color: "amber", icon: "Users", sortOrder: 12, description: "Integrated social studies spanning society, civics & economics." },
];

const GRADIENTS = [
  "from-amber-400 via-orange-500 to-rose-500",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
  "from-violet-400 via-purple-500 to-indigo-500",
  "from-sky-400 via-blue-500 to-indigo-500",
  "from-lime-400 via-green-500 to-emerald-600",
  "from-cyan-400 via-sky-500 to-blue-600",
  "from-fuchsia-400 via-pink-500 to-rose-600",
];

// Realistic chapter content per subject
const CONTENT: Record<string, { title: string; chapters: { title: string; body: string }[] }> = {
  history: {
    title: "Themes in Indian History",
    chapters: [
      { title: "The Harappan Civilisation", body: "The Harappan Civilisation, also known as the Indus Valley Civilisation, flourished between 2600 and 1900 BCE across the north-western part of the Indian subcontinent. It was one of the earliest urban civilisations of the world, distinguished by its planned cities, standardized weights and measures, and a sophisticated drainage system. Cities such as Mohenjodaro, Harappa, Dholavira and Lothal reveal remarkable town planning with grid layouts, citadels and lower towns. The Great Bath of Mohenjodaro, the Granary and the Dockyard at Lothal stand as testaments to advanced engineering. Seals carved with motifs of unicorns, bulls and a proto-Shiva figure suggest a rich symbolic and possibly religious life. The script, however, remains undeciphered. The decline of the civilisation is attributed to climate change, shifting river courses and declining trade." },
      { title: "Kings, Farmers and Towns", body: "The period after 600 BCE saw the rise of states, cities and thriving agriculture. The sixteen Mahajanapadas emerged across the Gangetic plain, with Magadha eventually consolidating power under the Mauryan empire. The introduction of iron tools, paddy transplantation and the use of coins (punch-marked) transformed the economy. Trade guilds (shrenis) flourished and long-distance trade connected the Ganga valley to Central Asia and the Deccan. Inscriptions of Ashoka spread across the empire carried royal messages of dhamma, reflecting a state policy of moral governance. The Mauryan administration, described in the Arthashastra, was highly centralised with spies, ministers and a vast bureaucracy." },
      { title: "The Mughal Empire", body: "The Mughal empire, founded by Babur after the First Battle of Panipat in 1526, became one of the largest centralized states in pre-modern history. Under Akbar, the empire reached its cultural and political zenith with policies of sulh-i-kul (universal peace), religious tolerance and the integration of Rajput allies. The mansabdari system organized nobility and military ranks. Mughal art, architecture and painting synthesized Persian, Central Asian and Indian traditions, producing masterpieces like the Taj Mahal and the illustrated Hamzanama. The empire's decline in the eighteenth century resulted from administrative decay, fiscal stress, regional assertions and the rise of successor states like Awadh, Bengal and Hyderabad." },
    ],
  },
  geography: {
    title: "Fundamentals of Physical Geography",
    chapters: [
      { title: "Geography as a Discipline", body: "Geography is the study of the earth's surface, its physical features, climate, soils, vegetation and the human activities that shape and are shaped by it. It bridges the natural and social sciences. Physical geography examines landforms, climate, water and biosphere, while human geography studies population, settlements, economic activities and cultural patterns. The discipline employs tools such as maps, remote sensing, GIS and field observation to understand spatial patterns and processes. Understanding geography is essential for resource management, disaster mitigation and sustainable development." },
      { title: "The Origin and Evolution of the Earth", body: "The earth formed approximately 4.6 billion years ago from the solar nebula. The Big Bang theory describes the origin of the universe around 13.8 billion years ago. The early earth was hot and molten; gradual cooling formed the crust. Theories of continental drift by Wegener and seafloor spreading led to plate tectonics, which explains the movement of lithospheric plates and the formation of mountains, trenches and volcanic arcs. The evolution of the atmosphere and the origin of life in the oceans marked critical milestones in making earth habitable." },
      { title: "Climate", body: "Climate refers to the average weather conditions of a place over a long period. The earth's climate is driven by insolation, atmospheric circulation, ocean currents and the distribution of land and water. The Köppen classification groups climates into tropical, dry, temperate, continental and polar types. Monsoons, the seasonal reversal of winds, profoundly influence the Indian subcontinent. Factors such as latitude, altitude, pressure belts and the Coriolis effect shape global climate patterns. Human-induced climate change, caused by greenhouse gas emissions, is altering temperature and precipitation regimes worldwide." },
    ],
  },
  polity: {
    title: "Indian Constitution at Work",
    chapters: [
      { title: "Constitution: Why and How", body: "A constitution is the supreme law that defines the structure of government, distributes powers and guarantees rights to citizens. The Indian Constitution was framed by the Constituent Assembly between 1946 and 1949 under the chairmanship of Dr. Rajendra Prasad, with the Drafting Committee led by Dr. B.R. Ambedkar. It draws from various sources: parliamentary government from Britain, fundamental rights from the US Bill of Rights, and directive principles from the Irish Constitution. The Constitution establishes India as a sovereign, socialist, secular, democratic republic and balances unity with diversity through federalism with unitary features." },
      { title: "Fundamental Rights", body: "Fundamental Rights are guaranteed under Part III of the Constitution and are enforceable by courts. They include the right to equality, right to freedom, right against exploitation, right to freedom of religion, cultural and educational rights, and the right to constitutional remedies. Dr. Ambedkar called the right to constitutional remedies the heart and soul of the Constitution. These rights protect individuals from arbitrary state action and promote dignity and liberty. Reasonable restrictions may be imposed in the interest of public order, morality and national security." },
      { title: "The Judiciary", body: "The judiciary is the guardian of the Constitution and protector of fundamental rights. India has an integrated and independent judiciary with the Supreme Court at the apex, High Courts at the state level and subordinate courts below. The Supreme Court exercises original, appellate, advisory and special leave jurisdictions. Judicial review empowers courts to strike down laws and executive actions that violate the Constitution. Public Interest Litigation has democratized access to justice, allowing public-spirited individuals to approach courts on behalf of marginalized groups." },
    ],
  },
  economics: {
    title: "Introductory Microeconomics",
    chapters: [
      { title: "Introduction", body: "Economics studies how societies allocate scarce resources to satisfy unlimited wants. It is divided into microeconomics, which examines individual agents such as households and firms, and macroeconomics, which studies the economy as a whole including national income, employment and inflation. The central problems of an economy — what to produce, how to produce and for whom to produce — arise from scarcity. Different economic systems such as market capitalism, socialism and mixed economies address these problems in distinct ways. India adopted a mixed economy model after independence." },
      { title: "Theory of Consumer Behaviour", body: "Consumers maximize their satisfaction (utility) subject to a budget constraint. The law of diminishing marginal utility states that as consumption of a good increases, the additional satisfaction from each extra unit declines. Indifference curve analysis represents consumer preferences, while the budget line represents affordability. Equilibrium is reached where the indifference curve is tangent to the budget line. Changes in income and prices shift or rotate the budget line, altering the optimal consumption bundle and leading to income and substitution effects." },
      { title: "Market Equilibrium", body: "Market equilibrium occurs where market demand equals market supply, determining the equilibrium price and quantity. When price is above equilibrium, surplus emerges, pushing prices down; when below, shortage drives prices up. Government intervention through price ceilings and floors can create shortages or surpluses. Elasticity of demand and supply determines how quantities respond to price changes. Understanding equilibrium is crucial for analyzing taxes, subsidies and the impact of shocks on markets." },
    ],
  },
  science: {
    title: "General Science Foundations",
    chapters: [
      { title: "Matter in Our Surroundings", body: "Matter is anything that occupies space and has mass. It exists in three primary states — solid, liquid and gas — distinguished by the arrangement and movement of particles. Solids have fixed shape and volume, liquids flow and take the shape of the container, while gases expand to fill available space. Changes of state such as melting, freezing, evaporation and condensation involve energy exchange. Plasma and Bose-Einstein condensates are additional states of matter. Understanding particle nature explains phenomena like diffusion, compression and the behavior of substances under varying temperature and pressure." },
      { title: "Motion and Force", body: "Motion is a change in the position of an object with respect to time. Displacement, velocity and acceleration describe motion quantitatively. Newton's three laws of motion form the foundation of classical mechanics: the law of inertia, the relation between force and acceleration (F = ma), and the action-reaction principle. Forces can change the state of motion or the shape of objects. Friction, though often a hindrance, is essential for walking, braking and gripping. Understanding motion and force enables analysis of everything from falling apples to orbiting satellites." },
      { title: "Diversity in Living Organisms", body: "Living organisms display enormous diversity in form, habitat and function. Classification organizes this diversity into groups based on shared characteristics. The five-kingdom classification by Whittaker divides organisms into Monera, Protista, Fungi, Plantae and Animalia. Within animals, further division into invertebrates and vertebrates reflects evolutionary complexity. Biodiversity ensures ecosystem stability and provides resources for food, medicine and materials. Conservation of biodiversity is vital for sustaining life on earth." },
    ],
  },
  biology: {
    title: "Biology: Life Processes",
    chapters: [
      { title: "The Living World", body: "What distinguishes the living from the non-living? Living organisms exhibit growth, reproduction, metabolism, response to stimuli and cellular organization. The diversity of life is organized through taxonomy into kingdoms, divisions, classes, orders, families, genera and species. Binomial nomenclature, introduced by Carolus Linnaeus, gives each organism a two-part scientific name. Museums, herbaria, botanical gardens and zoological parks preserve and study biodiversity. Understanding the living world is the foundation of biology and essential for medicine, agriculture and conservation." },
      { title: "Cell: The Unit of Life", body: "The cell is the basic structural and functional unit of life. The cell theory, proposed by Schleiden and Schwann, states that all living things are composed of cells and that the cell is the basic unit of life. Cells are classified as prokaryotic (without a nucleus, e.g., bacteria) or eukaryotic (with a true nucleus). The cell membrane, cytoplasm and organelles such as the nucleus, mitochondria, endoplasmic reticulum, Golgi apparatus and ribosomes each perform specialized functions. Plant cells differ from animal cells in having cell walls, plastids and large vacuoles. The discovery of the cell revolutionized our understanding of biology." },
      { title: "Human Physiology", body: "Human physiology studies how the body functions. Digestion breaks down food into absorbable nutrients; respiration releases energy from these nutrients. The circulatory system transports oxygen, nutrients and waste using the heart and blood vessels. The excretory system removes nitrogenous wastes through the kidneys. The nervous and endocrine systems coordinate and regulate body activities. Homeostasis maintains internal stability. Understanding physiology is the basis of medicine and health science." },
    ],
  },
  chemistry: {
    title: "Chemistry: Matter and Change",
    chapters: [
      { title: "Some Basic Concepts of Chemistry", body: "Chemistry deals with the composition, structure, properties and transformation of matter. Matter is classified into elements, compounds and mixtures. The mole concept relates the mass of a substance to the number of particles it contains, with Avogadro's number (6.022 x 10^23) bridging the atomic and macroscopic scales. Chemical equations represent reactions quantitatively, and stoichiometry allows calculation of reactants and products. Understanding these concepts is fundamental to all branches of chemistry and to industrial applications." },
      { title: "Structure of Atom", body: "The atom consists of a dense nucleus of protons and neutrons, surrounded by electrons. Dalton's atomic theory, Thomson's plum pudding model, Rutherford's nuclear model and Bohr's planetary model successively refined our understanding. Quantum mechanics describes electrons as occupying orbitals defined by probability distributions. The arrangement of electrons in shells and subshells determines chemical behavior. The modern periodic table organizes elements by atomic number, revealing periodic trends in atomic radius, ionization energy and electronegativity." },
      { title: "Chemical Bonding", body: "Atoms combine to achieve stable electron configurations, forming chemical bonds. Ionic bonds result from the transfer of electrons between metals and non-metals, as in sodium chloride. Covalent bonds involve the sharing of electrons, as in water and methane. Metallic bonds account for the properties of metals. The shape of molecules, predicted by VSEPR theory, influences polarity and reactivity. Understanding bonding explains the properties of substances and underlies all chemical reactions." },
    ],
  },
  physics: {
    title: "Physics: Principles and Applications",
    chapters: [
      { title: "Units and Measurement", body: "Measurement is the comparison of an unknown quantity with a standard. The International System of Units (SI) defines seven base units: metre, kilogram, second, ampere, kelvin, mole and candela. Derived units combine these to express quantities such as force, energy and pressure. Accuracy and precision characterize the quality of measurements, while significant figures communicate their reliability. Dimensional analysis checks the consistency of equations and helps derive relationships between physical quantities." },
      { title: "Laws of Motion", body: "Newton's laws of motion describe the relationship between a body and the forces acting on it. The first law, the law of inertia, states that an object remains at rest or in uniform motion unless acted upon by a net external force. The second law quantifies this: force equals mass times acceleration. The third law states that every action has an equal and opposite reaction. These laws explain phenomena from projectile motion to rocket propulsion and form the bedrock of classical mechanics." },
      { title: "Work, Energy and Power", body: "Work is done when a force causes displacement. Energy is the capacity to do work and exists in many forms — kinetic, potential, thermal, chemical and nuclear. The work-energy theorem connects work to changes in kinetic energy. The law of conservation of energy states that energy can neither be created nor destroyed, only transformed. Power is the rate of doing work. These concepts are central to understanding machines, engines and the natural world." },
    ],
  },
  mathematics: {
    title: "Mathematics: Sets, Functions and Beyond",
    chapters: [
      { title: "Sets", body: "A set is a well-defined collection of distinct objects. Sets are described in roster or set-builder form and can be finite or infinite. Operations on sets include union, intersection, difference and complement, governed by laws such as De Morgan's laws. Venn diagrams provide visual representation of set relationships. Set theory, developed by Georg Cantor, forms the language of modern mathematics and underpins probability, logic and computer science." },
      { title: "Trigonometric Functions", body: "Trigonometry relates the angles and sides of triangles. The six trigonometric functions — sine, cosine, tangent, cosecant, secant and cotangent — extend to circular functions defined for all real numbers using the unit circle. Identities such as sin^2 + cos^2 = 1 and the sum and difference formulas enable simplification of expressions and solution of equations. Trigonometric functions model periodic phenomena such as sound waves, tides and oscillations." },
      { title: "Calculus: Limits and Derivatives", body: "Calculus studies change and accumulation. The limit describes the value a function approaches as the input approaches a point. The derivative, defined as the limit of the difference quotient, measures the instantaneous rate of change and gives the slope of the tangent. Derivatives of common functions follow established rules such as the product, quotient and chain rules. Calculus, developed independently by Newton and Leibniz, is indispensable in physics, engineering, economics and biology." },
    ],
  },
  environment: {
    title: "Environmental Studies",
    chapters: [
      { title: "Ecosystems", body: "An ecosystem is a functional unit of nature where living organisms interact with each other and with their physical environment. Ecosystems consist of biotic components — producers, consumers and decomposers — and abiotic components such as light, temperature, water and soil. Energy flows through ecosystems via food chains and webs, with only about ten percent transferred between trophic levels. Biogeochemical cycles of carbon, nitrogen and phosphorus recycle essential elements. Understanding ecosystems is the basis of ecology and conservation." },
      { title: "Biodiversity and Conservation", body: "Biodiversity refers to the variety of life at genetic, species and ecosystem levels. India, a megadiverse country, harbors a rich variety of flora and fauna. Biodiversity is threatened by habitat loss, overexploitation, pollution, invasive species and climate change. Conservation strategies include in-situ methods such as national parks and sanctuaries, and ex-situ methods such as zoos and seed banks. The Convention on Biological Diversity and national laws aim to protect and sustainably use biodiversity for future generations." },
      { title: "Climate Change", body: "Climate change refers to long-term shifts in temperature and weather patterns, driven largely by human activities that release greenhouse gases such as carbon dioxide and methane. The Intergovernmental Panel on Climate Change documents rising global temperatures, melting glaciers, sea-level rise and increased frequency of extreme events. Mitigation requires reducing emissions through renewable energy, energy efficiency and afforestation. Adaptation involves building resilience in agriculture, infrastructure and communities. Climate justice emphasizes equitable burden-sharing between developed and developing nations." },
    ],
  },
  "art-culture": {
    title: "Indian Art and Culture",
    chapters: [
      { title: "Architecture Through the Ages", body: "Indian architecture spans millennia, from the Indus Valley cities to modern structures. Buddhist stupas at Sanchi, rock-cut caves at Ajanta and Ellora, and Hindu temples such as Kailasa and Brihadeshvara reflect diverse traditions. Indo-Islamic architecture introduced domes, arches and minarets, reaching its zenith in Mughal monuments like the Taj Mahal. Colonial architecture blended European and Indian elements. Each tradition contributes to India's rich architectural heritage and continuity of craft." },
      { title: "Classical Dances of India", body: "India recognizes eight classical dance forms: Bharatanatyam, Kathak, Odissi, Manipuri, Kuchipudi, Mohiniyattam, Sattriya and Kathakali. Each draws from the Natya Shastra, the ancient treatise on performing arts, and combines nritta (pure dance), nritya (expressive dance) and natya (drama). Dance communicates stories from mythology, conveys spiritual themes and preserves regional traditions. The guru-shishya parampara ensures the transmission of these art forms across generations." },
      { title: "Music and Musical Traditions", body: "Indian music is divided into the Hindustani classical tradition of the north and the Carnatic tradition of the south. Both are built on raga (melodic framework) and tala (rhythmic cycle). The Sama Veda is the earliest source of Indian musical thought. Instruments such as the sitar, veena, tabla and mridangam accompany vocal and instrumental performances. Music in India is deeply intertwined with devotion, season, time of day and emotion, reflecting a sophisticated aesthetic philosophy." },
    ],
  },
  "social-science": {
    title: "Social Science: Society and Change",
    chapters: [
      { title: "Understanding Society", body: "Society is a web of social relationships. Sociology studies how individuals and groups interact, form institutions and create shared meanings. Social structures such as family, caste, class and religion shape behavior and opportunities. Socialization transmits culture and norms across generations. Social change arises from factors such as technology, economy, ideology and collective action. Understanding society helps explain inequalities, conflicts and the possibilities for reform and justice." },
      { title: "Civics and Democratic Life", body: "Civics examines the rights and duties of citizens and the functioning of government. A democracy rests on popular sovereignty, rule of law, free elections and fundamental rights. Citizens participate through voting, public discussion, association and peaceful protest. Local self-government, including panchayats and municipalities, brings governance closer to people. Active and informed citizenship strengthens democracy and ensures accountability of those in power." },
      { title: "Economic Life", body: "Economic life encompasses the production, distribution and consumption of goods and services. People earn livelihoods through agriculture, industry, services and the informal sector. The economy is shaped by resources, technology, institutions and government policy. Issues such as poverty, unemployment and inequality require targeted interventions through welfare programs, education and skill development. Sustainable development balances economic growth with environmental protection and social equity." },
    ],
  },
};

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

async function generatePdf(opts: {
  title: string;
  author: string;
  subject: string;
  classNum: number;
  chapters: { title: string; body: string }[];
  outPath: string;
}): Promise<{ pages: number; fileSizeKb: number }> {
  const doc = await PDFDocument.create();
  doc.setTitle(opts.title);
  doc.setAuthor(opts.author);
  doc.setSubject(opts.subject);
  doc.setProducer("NCERT Library for IAS");
  doc.setCreator("pdf-lib");

  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const W = 595.28,
    H = 841.89; // A4
  const margin = 64;
  const maxW = W - margin * 2;

  const emerald = rgb(0.05, 0.36, 0.32);
  const ink = rgb(0.13, 0.13, 0.13);
  const muted = rgb(0.45, 0.45, 0.45);
  const line = rgb(0.85, 0.82, 0.74);

  // ---- Cover page ----
  {
    const p = doc.addPage([W, H]);
    p.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.98, 0.96, 0.92) });
    p.drawRectangle({ x: 0, y: H - 14, width: W, height: 14, color: emerald });
    p.drawRectangle({ x: 0, y: 0, width: W, height: 14, color: emerald });

    p.drawText("NCERT LIBRARY FOR IAS", {
      x: margin,
      y: H - 120,
      size: 11,
      font: bold,
      color: emerald,
    });

    p.drawText(opts.subject.toUpperCase(), {
      x: margin,
      y: H - 150,
      size: 11,
      font,
      color: muted,
    });

    // Title
    const titleLines = wrap(opts.title, bold, 30, maxW);
    let y = H - 320;
    for (const ln of titleLines) {
      p.drawText(ln, { x: margin, y, size: 30, font: bold, color: ink });
      y -= 38;
    }

    p.drawText(`Class ${opts.classNum}`, { x: margin, y: y - 30, size: 16, font: italic, color: muted });

    p.drawText(`Author: ${opts.author}`, { x: margin, y: 110, size: 11, font, color: muted });
    p.drawText("Published by NCERT Library for IAS", { x: margin, y: 90, size: 10, font, color: muted });
    p.drawText("For educational use by UPSC aspirants", { x: margin, y: 74, size: 10, font, color: muted });
  }

  // ---- Table of contents ----
  {
    const p = doc.addPage([W, H]);
    p.drawText("Contents", { x: margin, y: H - margin - 10, size: 22, font: bold, color: emerald });
    p.drawLine({ start: { x: margin, y: H - margin - 24 }, end: { x: W - margin, y: H - margin - 24 }, thickness: 1, color: line });

    let y = H - margin - 60;
    opts.chapters.forEach((ch, i) => {
      const num = `${i + 1}.`;
      p.drawText(num, { x: margin, y, size: 12, font: bold, color: emerald });
      p.drawText(ch.title, { x: margin + 28, y, size: 12, font, color: ink });
      y -= 26;
    });
  }

  // ---- Chapters ----
  let pages = 2;
  opts.chapters.forEach((ch, idx) => {
    // chapter heading on its own area at top of first page of chapter
    const p = doc.addPage([W, H]);
    pages++;
    let y = H - margin - 10;

    p.drawText(`Chapter ${idx + 1}`, { x: margin, y, size: 12, font: bold, color: emerald });
    y -= 24;
    const headingLines = wrap(ch.title, bold, 20, maxW);
    for (const ln of headingLines) {
      p.drawText(ln, { x: margin, y, size: 20, font: bold, color: ink });
      y -= 26;
    }
    p.drawLine({ start: { x: margin, y: y - 6 }, end: { x: W - margin, y: y - 6 }, thickness: 0.8, color: line });
    y -= 30;

    const bodyLines = wrap(ch.body, font, 11.5, maxW);
    for (const ln of bodyLines) {
      if (y < margin + 40) {
        // new page
        const np = doc.addPage([W, H]);
        pages++;
        // page number footer
        np.drawText(String(pages), { x: W / 2 - 4, y: 34, size: 10, font, color: muted });
        y = H - margin - 10;
        np.drawText(ln, { x: margin, y, size: 11.5, font, color: ink });
        y -= 18;
        continue;
      }
      p.drawText(ln, { x: margin, y, size: 11.5, font, color: ink });
      y -= 18;
    }

    // footer page number on current page
    p.drawText(String(pages), { x: W / 2 - 4, y: 34, size: 10, font, color: muted });
  });

  const bytes = await doc.save();
  writeFileSync(opts.outPath, bytes);
  return { pages, fileSizeKb: Math.round(bytes.length / 1024) };
}

function wrap(text: string, font: any, size: number, maxW: number): string[] {
  const out: string[] = [];
  const paragraphs = text.split("\n");
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      const width = font.widthOfTextAtSize(test, size);
      if (width > maxW && line) {
        out.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding NCERT Library…");

  // Languages
  const en = await db.language.upsert({ where: { code: "en" }, update: {}, create: { name: "English", code: "en" } });
  const hi = await db.language.upsert({ where: { code: "hi" }, update: {}, create: { name: "Hindi", code: "hi" } });

  // Subjects
  for (const s of SUBJECTS) {
    await db.subject.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, color: s.color, icon: s.icon, sortOrder: s.sortOrder },
      create: s,
    });
  }

  const booksDir = join(process.cwd(), "public", "books");
  if (!existsSync(booksDir)) mkdirSync(booksDir, { recursive: true });

  // Build books: for each subject pick 2-3 books across classes
  let created = 0;
  const authors = [
    "NCERT Publication Division", "Dr. R. Sharma", "Prof. M. Iyengar", "Dr. A. Nair",
    "NCERT Expert Panel", "Prof. S. Banerjee", "Dr. K. Mehta", "NCERT Textbook Committee",
  ];

  for (const s of SUBJECTS) {
    const subject = await db.subject.findUnique({ where: { slug: s.slug } });
    if (!subject) continue;
    const content = CONTENT[s.slug];
    if (!content) continue;

    const variants = [
      { classNum: [6, 7, 8][created % 3], type: "NEW", lang: en },
      { classNum: [9, 10][created % 2], type: "NEW", lang: en },
      { classNum: [11, 12][created % 2], type: "OLD", lang: en },
      { classNum: [9, 10, 11, 12][created % 4], type: "OLD", lang: hi },
    ];

    for (let v = 0; v < Math.min(variants.length, 3); v++) {
      const variant = variants[v];
      const titleBase = content.title;
      const title = v === 0 ? titleBase : `${titleBase} — Part ${v + 1}`;
      const slug = `${s.slug}-class-${variant.classNum}-${v + 1}`.toLowerCase();
      const pdfName = `${slug}.pdf`;
      const pdfPath = join(booksDir, pdfName);

      const author = authors[(created + v) % authors.length];

      const { pages, fileSizeKb } = await generatePdf({
        title,
        author,
        subject: s.name,
        classNum: variant.classNum,
        chapters: content.chapters,
        outPath: pdfPath,
      });

      const chaptersJson = JSON.stringify(
        content.chapters.map((c, i) => ({ title: c.title, page: 3 + i * 3 }))
      );

      await db.book.upsert({
        where: { slug },
        update: {
          title, author, description: content.chapters[0].body.slice(0, 220) + "…",
          subjectId: subject.id, languageId: variant.lang.id, classNum: variant.classNum,
          bookType: variant.type, pdfUrl: `/books/${pdfName}`, pages, fileSizeKb,
          coverGradient: GRADIENTS[(created + v) % GRADIENTS.length],
          chapters: chaptersJson,
          edition: `${2024 - v} Edition`, publisher: "NCERT",
          publishedYear: 2024 - v, rating: 4 + ((created * 7 + v) % 10) / 10,
          ratingCount: 80 + ((created * 13 + v * 7) % 900),
          downloadCount: 200 + ((created * 29 + v * 11) % 4000),
          viewCount: 800 + ((created * 53 + v * 17) % 12000),
          trending: (created + v) % 3 === 0,
          featured: v === 0,
          recentlyAdded: v === 1,
          allowDownload: variant.type === "NEW",
        },
        create: {
          title, slug, author, description: content.chapters[0].body.slice(0, 220) + "…",
          subjectId: subject.id, languageId: variant.lang.id, classNum: variant.classNum,
          bookType: variant.type, pdfUrl: `/books/${pdfName}`, pages, fileSizeKb,
          coverGradient: GRADIENTS[(created + v) % GRADIENTS.length],
          chapters: chaptersJson,
          edition: `${2024 - v} Edition`, publisher: "NCERT",
          publishedYear: 2024 - v, rating: 4 + ((created * 7 + v) % 10) / 10,
          ratingCount: 80 + ((created * 13 + v * 7) % 900),
          downloadCount: 200 + ((created * 29 + v * 11) % 4000),
          viewCount: 800 + ((created * 53 + v * 17) % 12000),
          trending: (created + v) % 3 === 0,
          featured: v === 0,
          recentlyAdded: v === 1,
          allowDownload: variant.type === "NEW",
        },
      });
      created++;
    }
  }

  // Admin + demo user
  const adminEmail = "admin@ncertias.in";
  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Library Admin",
      role: "ADMIN",
      passwordHash: "$demo$admin", // demo only
      bio: "Curator of the NCERT Library for IAS.",
    },
  });
  const demo = await db.user.upsert({
    where: { email: "aspirant@ncertias.in" },
    update: {},
    create: {
      email: "aspirant@ncertias.in",
      name: "Aarav Sharma",
      passwordHash: "$demo$aspirant",
      bio: "UPSC 2025 aspirant. History & Polity focus.",
    },
  });

  // Seed a few achievements for demo user
  const achievements = [
    { type: "FIRST_BOOK", label: "First Steps", icon: "BookOpen" },
    { type: "TEN_BOOKS", label: "Bookworm", icon: "Library" },
    { type: "READER_100", label: "Centurion Reader", icon: "Award" },
    { type: "NIGHT_OWL", label: "Night Owl", icon: "Moon" },
  ];
  for (const a of achievements) {
    await db.achievement.upsert({
      where: { userId_type: { userId: demo.id, type: a.type } },
      update: {},
      create: { userId: demo.id, type: a.type, label: a.label, icon: a.icon },
    });
  }

  console.log(`Seeded ${created} books, admin: ${admin.email}, demo: ${demo.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
