import { z } from 'zod';

export const cardSearchQuerySchema = z.object({
  q: z.string().optional(),
  supertype: z.string().optional(),
  subtype: z.string().optional(),
  setId: z.string().optional(),
  rarity: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(250).optional(),
});

export const createInventorySchema = z.object({
  catalogCardId: z.string().min(1),
  cardName: z.string().min(1),
  supertype: z.enum(['Pokémon', 'Trainer', 'Energy']),
  variant: z.string().default('normal'),
  finish: z.string().default('non-holo'),
  language: z.string().default('EN'),
  condition: z.string().default('NM'),
  quantity: z.number().int().positive(),
  locationId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
});

export const updateInventorySchema = z
  .object({
    locationId: z.string().uuid().nullable().optional(),
    notes: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    condition: z.string().optional(),
    language: z.string().optional(),
    variant: z.string().optional(),
    finish: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const createDeckSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['active', 'reference']),
  format: z.enum(['Standard', 'Expanded', 'Casual']),
  notes: z.string().nullable().optional(),
});

export const updateDeckSchema = z
  .object({
    name: z.string().min(1).optional(),
    format: z.enum(['Standard', 'Expanded', 'Casual']).optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const addCardSlotSchema = z.object({
  catalogCardId: z.string().min(1),
  cardName: z.string().min(1),
  supertype: z.enum(['Pokémon', 'Trainer', 'Energy']),
  requiredQuantity: z.number().int().positive(),
});

export const removeCardSlotSchema = z.object({
  deckCardId: z.string().uuid(),
});

export const assignCardSchema = z.object({
  deckCardId: z.string().uuid(),
  physicalCopyId: z.string().uuid(),
});

export const removeCardSchema = z.object({
  deckCardId: z.string().uuid(),
  physicalCopyId: z.string().uuid(),
});

export const compareDecklistSchema = z.object({
  decklist: z.string().min(1),
});

export const createLocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['binder', 'deckbox', 'bulk', 'loan', 'sale', 'lost', 'other']),
});

export const movementQuerySchema = z.object({
  inventoryItemId: z.string().uuid().optional(),
  physicalCopyId: z.string().uuid().optional(),
  deckId: z.string().uuid().optional(),
});

export const loanCopySchema = z.object({
  copyId: z.string().uuid(),
  locationId: z.string().uuid(),
  note: z.string().optional(),
});

export const returnCopySchema = z.object({
  copyId: z.string().uuid(),
  locationId: z.string().uuid(),
});

export const buyListQuerySchema = z.object({
  status: z.enum(['pending', 'purchased', 'cancelled']).optional(),
  sourceDeckId: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

export const addBuyListSchema = z.object({
  catalogCardId: z.string().min(1),
  cardName: z.string().min(1),
  supertype: z.enum(['Pokémon', 'Trainer', 'Energy']),
  quantity: z.number().int().positive(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  sourceDeckId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateBuyListSchema = z
  .object({
    desiredQuantity: z.number().int().positive().optional(),
    acquiredQuantity: z.number().int().min(0).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    status: z.enum(['pending', 'purchased', 'cancelled']).optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const updateBuyListStatusSchema = z.object({
  status: z.enum(['pending', 'purchased', 'cancelled']),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type CreateDeckInput = z.infer<typeof createDeckSchema>;
export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
export type AddCardSlotInput = z.infer<typeof addCardSlotSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type CompareDecklistInput = z.infer<typeof compareDecklistSchema>;
export type RemoveCardSlotInput = z.infer<typeof removeCardSlotSchema>;
export type AssignCardInput = z.infer<typeof assignCardSchema>;
export type RemoveCardInput = z.infer<typeof removeCardSchema>;
export type BuyListQueryInput = z.infer<typeof buyListQuerySchema>;
export type AddBuyListInput = z.infer<typeof addBuyListSchema>;
export type UpdateBuyListInput = z.infer<typeof updateBuyListSchema>;
export type UpdateBuyListStatusInput = z.infer<typeof updateBuyListStatusSchema>;
