import { z } from 'zod';

export const MAX_CRITERIA = 4;
export const MAX_HISTORY = 100;
export const StoreIdSchema = z.enum(['amazon', 'aliexpress', 'ebay', 'rakuten']);
export type StoreId = z.infer<typeof StoreIdSchema>;

// Every property is required (nullable where appropriate) for strict structured outputs.
export const CriterionSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().min(1).max(70),
  description: z.string().max(180),
  kind: z.enum(['boolean', 'numeric', 'text', 'budget']),
  comparison: z.enum(['at_most', 'at_least', 'equals', 'includes']),
  target: z.string().min(1).max(80),
  unit: z.string().max(16).nullable(),
});
export type Criterion = z.infer<typeof CriterionSchema>;

export const ChatTurnSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) });
export const ChatReplySchema = z.object({
  reply: z.string().min(1).max(3000),
  state: z.enum(['question', 'ready']),
  title: z.string().max(100).nullable(),
  searchQuery: z.string().max(160).nullable(),
  criteria: z.array(CriterionSchema).max(MAX_CRITERIA),
  suggestedReplies: z.array(z.string().max(100)).max(3),
});
export type ChatReply = z.infer<typeof ChatReplySchema>;
export type ChatTurn = z.infer<typeof ChatTurnSchema>;

export const PreferencesSchema = z.object({ currency: z.string().regex(/^[A-Z]{3}$/), destination: z.string().regex(/^[A-Z]{2}$/) });
export type Preferences = z.infer<typeof PreferencesSchema>;
export const ShoppingSessionSchema = z.object({
  id: z.string().min(8).max(80), title: z.string().min(1).max(100),
  searchQuery: z.string().min(1).max(160), criteria: z.array(CriterionSchema).min(1).max(MAX_CRITERIA),
  preferences: PreferencesSchema, updatedAt: z.number().int().positive(),
});
export type ShoppingSession = z.infer<typeof ShoppingSessionSchema>;

export const MoneySchema = z.object({ amount: z.number().finite().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) });
export type Money = z.infer<typeof MoneySchema>;
export const ProductSnapshotSchema = z.object({
  url: z.string().url().max(2048), canonicalUrl: z.string().url().max(2048),
  store: StoreIdSchema, title: z.string().min(1).max(400), image: z.string().max(2048).nullable(),
  price: MoneySchema.nullable(), totalPrice: MoneySchema.nullable(),
  evidence: z.string().min(5).max(28000), variant: z.string().max(300), capturedAt: z.number().int().positive(),
});
export type ProductSnapshot = z.infer<typeof ProductSnapshotSchema>;

export const CriterionFindingSchema = z.object({
  criterionId: z.string().max(40), status: z.enum(['match', 'not_match', 'unknown']),
  observed: z.string().max(240).nullable(), reason: z.string().max(400),
  evidenceQuote: z.string().max(600).nullable(),
});
export const AnalysisReplySchema = z.object({ findings: z.array(CriterionFindingSchema).max(MAX_CRITERIA) });
export type CriterionFinding = z.infer<typeof CriterionFindingSchema>;
export type AnalysisReply = z.infer<typeof AnalysisReplySchema>;
export const AnalysisRecordSchema = z.object({
  id: z.string(), session: ShoppingSessionSchema, criteriaKey: z.string(), product: ProductSnapshotSchema,
  findings: z.array(CriterionFindingSchema).min(1).max(MAX_CRITERIA), score: z.number().min(0).max(100), checkedAt: z.number(),
});
export type AnalysisRecord = z.infer<typeof AnalysisRecordSchema>;

export type ApiError = { error: { code: string; message: string; retryable: boolean } };
export type AppConfig = { apiReady: boolean; model: string; extensionStoreUrl: string | null; bridgeToken: string; apiOrigin: string };
export type BridgeConfig = { token: string; apiOrigin: string };

export type ExtensionState = {
  session: ShoppingSession | null;
  connection: BridgeConfig | null;
  activeTabId: number | null;
  status: 'idle' | 'waiting' | 'analyzing' | 'ready' | 'error';
  product: ProductSnapshot | null;
  current: AnalysisRecord | null;
  error: string | null;
  history: AnalysisRecord[];
};
export const initialExtensionState: ExtensionState = { session: null, connection: null, activeTabId: null, status: 'idle', product: null, current: null, error: null, history: [] };
export const ChatRequestSchema = z.object({ messages: z.array(ChatTurnSchema).min(1).max(40), preferences: PreferencesSchema, currentCriteria: z.array(CriterionSchema).max(MAX_CRITERIA) });
export const AnalyzeRequestSchema = z.object({ session: ShoppingSessionSchema, product: ProductSnapshotSchema });
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
