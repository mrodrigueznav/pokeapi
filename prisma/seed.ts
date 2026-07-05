import { PrismaClient, Supertype } from '@prisma/client';
import { playableKey } from '../src/utils/playableKey';

const prisma = new PrismaClient();

const CATALOG_CARDS = [
  {
    id: 'sv3-125',
    name: 'Charizard ex',
    supertype: Supertype.Pokemon,
    subtypes: ['Stage 2', 'ex'],
    types: ['Fire'],
    setId: 'sv3',
    setName: 'Obsidian Flames',
    number: '125',
    rarity: 'Double Rare',
    imageUrl: 'https://images.pokemontcg.io/sv3/125.png',
    imageUrlLarge: 'https://images.pokemontcg.io/sv3/125_hires.png',
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'swsh9-178',
    name: "Professor's Research",
    supertype: Supertype.Trainer,
    subtypes: ['Supporter'],
    types: [],
    setId: 'swsh9',
    setName: 'Brilliant Stars',
    number: '178',
    rarity: 'Rare Holo',
    imageUrl: 'https://images.pokemontcg.io/swsh9/178.png',
    imageUrlLarge: null,
    regulationMark: 'F',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv1-181',
    name: 'Nest Ball',
    supertype: Supertype.Trainer,
    subtypes: ['Item'],
    types: [],
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    number: '181',
    rarity: 'Uncommon',
    imageUrl: 'https://images.pokemontcg.io/sv1/181.png',
    imageUrlLarge: null,
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'swsh9-154',
    name: "Boss's Orders",
    supertype: Supertype.Trainer,
    subtypes: ['Supporter'],
    types: [],
    setId: 'swsh9',
    setName: 'Brilliant Stars',
    number: '154',
    rarity: 'Rare Holo',
    imageUrl: 'https://images.pokemontcg.io/swsh9/154.png',
    imageUrlLarge: null,
    regulationMark: 'F',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv1-191',
    name: 'Rare Candy',
    supertype: Supertype.Trainer,
    subtypes: ['Item'],
    types: [],
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    number: '191',
    rarity: 'Uncommon',
    imageUrl: 'https://images.pokemontcg.io/sv1/191.png',
    imageUrlLarge: null,
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv1-196',
    name: 'Ultra Ball',
    supertype: Supertype.Trainer,
    subtypes: ['Item'],
    types: [],
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    number: '196',
    rarity: 'Uncommon',
    imageUrl: 'https://images.pokemontcg.io/sv1/196.png',
    imageUrlLarge: null,
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv3-186',
    name: 'Arven',
    supertype: Supertype.Trainer,
    subtypes: ['Supporter'],
    types: [],
    setId: 'sv3',
    setName: 'Obsidian Flames',
    number: '186',
    rarity: 'Uncommon',
    imageUrl: 'https://images.pokemontcg.io/sv3/186.png',
    imageUrlLarge: null,
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv2-185',
    name: 'Iono',
    supertype: Supertype.Trainer,
    subtypes: ['Supporter'],
    types: [],
    setId: 'sv2',
    setName: 'Paldea Evolved',
    number: '185',
    rarity: 'Uncommon',
    imageUrl: 'https://images.pokemontcg.io/sv2/185.png',
    imageUrlLarge: null,
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv1-257',
    name: 'Basic Fire Energy',
    supertype: Supertype.Energy,
    subtypes: ['Basic'],
    types: [],
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    number: '257',
    rarity: 'Common',
    imageUrl: 'https://images.pokemontcg.io/sv1/257.png',
    imageUrlLarge: null,
    regulationMark: null,
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
  {
    id: 'sv1-223',
    name: 'Buddy-Buddy Poffin',
    supertype: Supertype.Trainer,
    subtypes: ['Item'],
    types: [],
    setId: 'sv1',
    setName: 'Scarlet & Violet',
    number: '223',
    rarity: 'Uncommon',
    imageUrl: 'https://images.pokemontcg.io/sv1/223.png',
    imageUrlLarge: null,
    regulationMark: 'G',
    legalities: { standard: 'Legal', expanded: 'Legal' },
    rules: [],
  },
] as const;

async function main() {
  console.log('Seeding TCG Deck Inventory database...');

  await prisma.movement.deleteMany();
  await prisma.deckCardAssignment.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.decklistCard.deleteMany();
  await prisma.decklist.deleteMany();
  await prisma.physicalCardCopy.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.buyListItem.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.cardCatalogItem.deleteMany();
  await prisma.location.deleteMany();

  const locBinder = await prisma.location.create({
    data: { name: 'Binder Principal', type: 'binder' },
  });
  const locDeckbox = await prisma.location.create({
    data: { name: 'Deck Box Charizard', type: 'deckbox' },
  });
  const locBulk = await prisma.location.create({
    data: { name: 'Bulk Box', type: 'bulk' },
  });
  const locLoan = await prisma.location.create({
    data: { name: 'Prestadas', type: 'loan' },
  });

  for (const card of CATALOG_CARDS) {
    await prisma.cardCatalogItem.create({ data: card });
  }

  const charizardKey = playableKey('Charizard ex', 'Pokémon');
  const nestBallKey = playableKey('Nest Ball', 'Trainer');
  const ionoKey = playableKey('Iono', 'Trainer');
  const researchKey = playableKey("Professor's Research", 'Trainer');
  const energyKey = playableKey('Basic Fire Energy', 'Energy');

  const charizardInv = await prisma.inventoryItem.create({
    data: {
      catalogCardId: 'sv3-125',
      playableCardKey: charizardKey,
      variant: 'normal',
      finish: 'holo',
      language: 'EN',
      condition: 'NM',
      quantity: 3,
      locationId: locBinder.id,
      tags: ['meta', 'charizard'],
      notes: 'Main playset copies',
    },
  });

  const charizardCopies = [];
  for (let i = 0; i < 3; i++) {
    charizardCopies.push(
      await prisma.physicalCardCopy.create({
        data: {
          inventoryItemId: charizardInv.id,
          status: 'available',
          locationId: locBinder.id,
        },
      })
    );
  }

  const nestBallInv = await prisma.inventoryItem.create({
    data: {
      catalogCardId: 'sv1-181',
      playableCardKey: nestBallKey,
      variant: 'normal',
      finish: 'non-holo',
      language: 'EN',
      condition: 'NM',
      quantity: 4,
      locationId: locBulk.id,
      tags: [],
    },
  });

  const nestBallCopies = [];
  for (let i = 0; i < 4; i++) {
    nestBallCopies.push(
      await prisma.physicalCardCopy.create({
        data: {
          inventoryItemId: nestBallInv.id,
          status: 'available',
          locationId: locBulk.id,
        },
      })
    );
  }

  const ionoInv = await prisma.inventoryItem.create({
    data: {
      catalogCardId: 'sv2-185',
      playableCardKey: ionoKey,
      variant: 'normal',
      finish: 'non-holo',
      language: 'EN',
      condition: 'LP',
      quantity: 2,
      locationId: locBinder.id,
      tags: [],
    },
  });

  const ionoCopies = [];
  for (let i = 0; i < 2; i++) {
    ionoCopies.push(
      await prisma.physicalCardCopy.create({
        data: {
          inventoryItemId: ionoInv.id,
          status: i === 0 ? 'available' : 'loaned',
          locationId: i === 0 ? locBinder.id : locLoan.id,
        },
      })
    );
  }

  const researchInv = await prisma.inventoryItem.create({
    data: {
      catalogCardId: 'swsh9-178',
      playableCardKey: researchKey,
      variant: 'normal',
      finish: 'non-holo',
      language: 'EN',
      condition: 'NM',
      quantity: 4,
      locationId: locBulk.id,
      tags: [],
    },
  });

  for (let i = 0; i < 4; i++) {
    await prisma.physicalCardCopy.create({
      data: {
        inventoryItemId: researchInv.id,
        status: 'available',
        locationId: locBulk.id,
      },
    });
  }

  const energyInv = await prisma.inventoryItem.create({
    data: {
      catalogCardId: 'sv1-257',
      playableCardKey: energyKey,
      variant: 'normal',
      finish: 'non-holo',
      language: 'EN',
      condition: 'NM',
      quantity: 10,
      locationId: locDeckbox.id,
      tags: ['energy'],
    },
  });

  for (let i = 0; i < 10; i++) {
    await prisma.physicalCardCopy.create({
      data: {
        inventoryItemId: energyInv.id,
        status: 'available',
        locationId: locDeckbox.id,
      },
    });
  }

  const ultraBallInv = await prisma.inventoryItem.create({
    data: {
      catalogCardId: 'sv1-196',
      playableCardKey: playableKey('Ultra Ball', 'Trainer'),
      variant: 'normal',
      finish: 'non-holo',
      language: 'EN',
      condition: 'NM',
      quantity: 3,
      locationId: locBulk.id,
      tags: [],
    },
  });

  for (let i = 0; i < 3; i++) {
    await prisma.physicalCardCopy.create({
      data: {
        inventoryItemId: ultraBallInv.id,
        status: 'available',
        locationId: locBulk.id,
      },
    });
  }

  const charizardDecklist = await prisma.decklist.create({
    data: {
      name: 'Charizard ex — Standard (list)',
      format: 'Standard',
      status: 'incomplete',
      notes: 'Decklist template — 10 cards for demo',
    },
  });

  const charizardListCard = await prisma.decklistCard.create({
    data: {
      decklistId: charizardDecklist.id,
      playableCardKey: charizardKey,
      catalogCardId: 'sv3-125',
      quantity: 3,
    },
  });

  const nestBallListCard = await prisma.decklistCard.create({
    data: {
      decklistId: charizardDecklist.id,
      playableCardKey: nestBallKey,
      catalogCardId: 'sv1-181',
      quantity: 4,
    },
  });

  const ionoListCard = await prisma.decklistCard.create({
    data: {
      decklistId: charizardDecklist.id,
      playableCardKey: ionoKey,
      catalogCardId: 'sv2-185',
      quantity: 3,
    },
  });

  const activeDeck = await prisma.deck.create({
    data: {
      name: 'Charizard ex — Standard',
      decklistId: charizardDecklist.id,
      status: 'incomplete',
      notes: 'Physical deck built from decklist — partially assigned',
    },
  });

  await prisma.physicalCardCopy.update({
    where: { id: charizardCopies[0].id },
    data: { status: 'assigned', assignedDeckId: activeDeck.id },
  });
  await prisma.deckCardAssignment.create({
    data: {
      deckId: activeDeck.id,
      decklistCardId: charizardListCard.id,
      physicalCopyId: charizardCopies[0].id,
    },
  });

  await prisma.physicalCardCopy.update({
    where: { id: nestBallCopies[0].id },
    data: { status: 'assigned', assignedDeckId: activeDeck.id },
  });
  await prisma.deckCardAssignment.create({
    data: {
      deckId: activeDeck.id,
      decklistCardId: nestBallListCard.id,
      physicalCopyId: nestBallCopies[0].id,
    },
  });

  await prisma.buyListItem.createMany({
    data: [
      {
        catalogCardId: 'sv3-125',
        cardName: 'Charizard ex',
        supertype: 'Pokemon',
        playableCardKey: charizardKey,
        desiredQuantity: 2,
        acquiredQuantity: 0,
        priority: 'high',
        status: 'pending',
        sourceDeckId: activeDeck.id,
        notes: 'Need more copies for the physical deck',
      },
      {
        catalogCardId: 'sv2-185',
        cardName: 'Iono',
        supertype: 'Trainer',
        playableCardKey: ionoKey,
        desiredQuantity: 2,
        acquiredQuantity: 0,
        priority: 'normal',
        status: 'pending',
        sourceDecklistId: charizardDecklist.id,
        notes: 'Missing from decklist template',
      },
      {
        catalogCardId: 'sv1-191',
        cardName: 'Rare Candy',
        supertype: 'Trainer',
        playableCardKey: playableKey('Rare Candy', 'Trainer'),
        desiredQuantity: 4,
        acquiredQuantity: 4,
        priority: 'normal',
        status: 'purchased',
        sourceDeckId: null,
        notes: 'Already bought at locals',
      },
    ],
  });

  const referenceDecklist = await prisma.decklist.create({
    data: {
      name: 'Meta Reference — Charizard',
      format: 'Standard',
      status: 'complete',
      notes: '60-card reference decklist',
    },
  });

  const refSlots = [
    { key: charizardKey, catalogId: 'sv3-125', qty: 3 },
    { key: nestBallKey, catalogId: 'sv1-181', qty: 4 },
    { key: ionoKey, catalogId: 'sv2-185', qty: 3 },
    { key: researchKey, catalogId: 'swsh9-178', qty: 4 },
    { key: playableKey('Ultra Ball', 'Trainer'), catalogId: 'sv1-196', qty: 3 },
    { key: playableKey('Rare Candy', 'Trainer'), catalogId: 'sv1-191', qty: 2 },
    { key: playableKey('Arven', 'Trainer'), catalogId: 'sv3-186', qty: 2 },
    { key: playableKey('Buddy-Buddy Poffin', 'Trainer'), catalogId: 'sv1-223', qty: 2 },
    { key: energyKey, catalogId: 'sv1-257', qty: 37 },
  ];

  for (const slot of refSlots) {
    await prisma.decklistCard.create({
      data: {
        decklistId: referenceDecklist.id,
        playableCardKey: slot.key,
        catalogCardId: slot.catalogId,
        quantity: slot.qty,
      },
    });
  }

  await prisma.movement.createMany({
    data: [
      {
        type: 'added',
        inventoryItemId: charizardInv.id,
        to: locBinder.id,
        note: 'Seed: added Charizard ex copies',
      },
      {
        type: 'assigned',
        physicalCopyId: charizardCopies[0].id,
        deckId: activeDeck.id,
        note: 'Seed: assigned to active deck',
      },
      {
        type: 'assigned',
        physicalCopyId: nestBallCopies[0].id,
        deckId: activeDeck.id,
        note: 'Seed: assigned Nest Ball',
      },
      {
        type: 'loaned',
        physicalCopyId: ionoCopies[1].id,
        inventoryItemId: ionoInv.id,
        to: locLoan.id,
        note: 'Seed: loaned Iono to friend',
      },
    ],
  });

  console.log('Seed completed successfully.');
  console.log(`  Locations: 4`);
  console.log(`  Catalog cards: ${CATALOG_CARDS.length}`);
  console.log(`  Decklist (active template): ${charizardDecklist.name}`);
  console.log(`  Physical deck: ${activeDeck.name} (incomplete)`);
  console.log(`  Reference decklist: ${referenceDecklist.name} (60 cards)`);
  console.log(`  Buy list items: 3`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
