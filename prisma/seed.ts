import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create sample symbols
  const symbols = [
    {
      id: "infinity",
      name: "Infinity Symbol (∞)",
      category: "mathematical",
      description:
        "Represents limitlessness, endlessness, and the concept of infinity in mathematics and philosophy.",
      interpretations: {
        mathematical: "Potential infinity, actual infinity",
        philosophical: "Eternal existence, unlimited possibility",
        spiritual: "Divine consciousness, eternal soul",
      },
      related_symbols: ["ouroboros", "mobius_strip", "eternal_knot"],
      properties: {
        unicode: "∞",
        category_weight: 0.9,
        complexity: "medium",
      },
    },
    {
      id: "ouroboros",
      name: "Ouroboros",
      category: "alchemical",
      description:
        "Ancient symbol of a serpent eating its own tail, representing cyclical nature of life, death, and rebirth.",
      interpretations: {
        alchemical: "Unity of opposites, eternal cycle",
        psychological: "Self-reflection, integration",
        spiritual: "Eternal return, cosmic cycles",
      },
      related_symbols: ["infinity", "yin_yang", "phoenix"],
      properties: {
        origin: "ancient_egypt",
        complexity: "high",
        archetypal: true,
      },
    },
    {
      id: "yin_yang",
      name: "Yin Yang (☯)",
      category: "philosophical",
      description:
        "Chinese symbol representing the dual nature of existence and the balance of opposing forces.",
      interpretations: {
        taoist: "Balance of yin and yang",
        philosophical: "Complementary opposites",
        cosmological: "Harmony in duality",
      },
      related_symbols: ["ouroboros", "mandala", "vesica_piscis"],
      properties: {
        unicode: "☯",
        origin: "chinese_taoism",
        balance_principle: true,
      },
    },
    {
      id: "mandala",
      name: "Mandala",
      category: "spiritual",
      description:
        "Sacred geometric pattern representing the cosmos, wholeness, and spiritual journey toward enlightenment.",
      interpretations: {
        buddhist: "Cosmic diagram, meditation aid",
        hindu: "Sacred space, divine presence",
        psychological: "Individuation, wholeness",
      },
      related_symbols: ["yin_yang", "sri_yantra", "flower_of_life"],
      properties: {
        geometry: "circular",
        complexity: "very_high",
        meditative: true,
      },
    },
    {
      id: "ankh",
      name: "Ankh (☥)",
      category: "egyptian",
      description:
        "Ancient Egyptian symbol of life, combining the symbols for male and female into a unified whole.",
      interpretations: {
        egyptian: "Key of life, eternal life",
        spiritual: "Divine life force",
        alchemical: "Union of opposites",
      },
      related_symbols: ["cross", "tau", "djed"],
      properties: {
        unicode: "☥",
        origin: "ancient_egypt",
        life_symbol: true,
      },
    },
    {
      id: "tree_of_life",
      name: "Tree of Life",
      category: "kabbalistic",
      description:
        "Mystical diagram used in Kabbalah to describe the path of divine energy and human spiritual development.",
      interpretations: {
        kabbalistic: "Sefirot and paths",
        spiritual: "Cosmic tree, axis mundi",
        psychological: "Stages of consciousness",
      },
      related_symbols: ["flower_of_life", "world_tree", "axis_mundi"],
      properties: {
        structure: "ten_sefirot",
        complexity: "very_high",
        mystical: true,
      },
    },
  ];

  // Create sample symbol sets
  const symbolSets = [
    {
      id: "sacred_geometry",
      name: "Sacred Geometry Collection",
      category: "spiritual",
      description:
        "Fundamental geometric patterns found in nature and spiritual traditions across cultures.",
      symbols: {
        mandala: { weight: 1.0 },
        flower_of_life: { weight: 0.9 },
        vesica_piscis: { weight: 0.8 },
        sri_yantra: { weight: 0.85 },
      },
    },
    {
      id: "cyclical_symbols",
      name: "Symbols of Cycles and Eternity",
      category: "philosophical",
      description:
        "Symbols representing eternal cycles, infinite loops, and the cyclical nature of existence.",
      symbols: {
        infinity: { weight: 1.0 },
        ouroboros: { weight: 0.95 },
        yin_yang: { weight: 0.8 },
        wheel_of_dharma: { weight: 0.7 },
      },
    },
    {
      id: "ancient_wisdom",
      name: "Ancient Wisdom Symbols",
      category: "historical",
      description:
        "Sacred symbols from ancient civilizations that encode spiritual and philosophical teachings.",
      symbols: {
        ankh: { weight: 0.9 },
        tree_of_life: { weight: 1.0 },
        eye_of_horus: { weight: 0.8 },
        caduceus: { weight: 0.7 },
      },
    },
    {
      id: "balance_duality",
      name: "Balance and Duality",
      category: "philosophical",
      description:
        "Symbols representing the balance of opposing forces and the unity found in duality.",
      symbols: {
        yin_yang: { weight: 1.0 },
        ouroboros: { weight: 0.8 },
        vesica_piscis: { weight: 0.7 },
        hermetic_seal: { weight: 0.6 },
      },
    },
  ];

  // Insert symbols
  for (const symbol of symbols) {
    await prisma.symbol.upsert({
      where: { id: symbol.id },
      update: {},
      create: symbol,
    });
  }

  // Insert symbol sets
  for (const symbolSet of symbolSets) {
    await prisma.symbolSet.upsert({
      where: { id: symbolSet.id },
      update: {},
      create: symbolSet,
    });
  }

  console.log(`✅ Created ${symbols.length} symbols`);
  console.log(`✅ Created ${symbolSets.length} symbol sets`);
  console.log("🌱 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
