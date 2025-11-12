# Watchlist System - Implementation Guide

## 📋 Overview

The watchlist system allows users to track their favorite stocks and receive personalized news summaries. It consists of:

1. **Mongoose Model** - Database schema for watchlist entries
2. **Server Actions** - Watchlist management and news fetching
3. **Inngest Functions** - Automated daily news delivery
4. **Cron Jobs** - Scheduled tasks for email delivery

---

## 🗂️ File Structure

```
database/models/
├── watchlist.model.ts              # Mongoose schema

lib/actions/
├── watchlist.actions.ts            # Core watchlist queries
├── watchlist-management.actions.ts # CRUD operations
└── finnhub.actions.ts              # News API integration

lib/inngest/
└── functions.ts                    # Daily news summary job
```

---

## 📦 Files Created

### 1. `database/models/watchlist.model.ts`

**Purpose:** Define the Watchlist collection schema

**Key Features:**

- ✅ Compound unique index on `userId + symbol`
- ✅ Automatic uppercase conversion for symbols
- ✅ Timestamp tracking (addedAt)
- ✅ Hot-reload safe model export

**Schema:**

```typescript
{
  userId: string; // User ID (indexed)
  symbol: string; // Stock symbol e.g., "AAPL" (uppercase)
  company: string; // Company name
  addedAt: Date; // When added to watchlist
}
```

---

### 2. `lib/actions/watchlist.actions.ts`

**Purpose:** Query watchlist by user email

**Exported Function:**

```typescript
getWatchlistSymbolsByEmail(email: string): Promise<string[]>
```

**Flow:**

1. Connect to MongoDB
2. Find user by email in Better Auth's user collection
3. Query Watchlist collection by userId
4. Return array of symbols

**Returns:** `['AAPL', 'MSFT', 'GOOGL']` or `[]` if user not found

**Error Handling:** Gracefully returns empty array with console logging

---

### 3. `lib/actions/watchlist-management.actions.ts`

**Purpose:** Add, remove, and view watchlist items

**Exported Functions:**

#### `addToWatchlist(input)`

```typescript
interface AddToWatchlistInput {
  userId: string;
  symbol: string;
  company: string;
}
```

- Adds a stock to watchlist
- Prevents duplicates (same symbol per user)
- Returns success/error response

#### `removeFromWatchlist(userId, symbol)`

- Removes a stock from watchlist
- Returns the removed item or error

#### `getUserWatchlist(userId)`

- Fetches all watchlist items for a user
- Returns full details (symbol, company, addedAt)
- Sorted by most recent first

#### `isSymbolInWatchlist(userId, symbol)`

- Quick check: boolean
- Useful for frontend validation

---

### 4. `lib/actions/finnhub.actions.ts`

**Purpose:** Fetch news from Finnhub API

**Configuration:**

```typescript
FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
```

**Helper Functions:**

#### `fetchJSON<T>(url, revalidateSeconds?)`

Generic fetch wrapper with intelligent caching:

- **With revalidateSeconds:** Uses Next.js ISR caching
- **Without:** Always fresh (no-store)

#### `validateArticle(article)`

Ensures article has required fields:

- `headline` or `url`
- `source`
- `datetime`

#### `formatArticle(article)`

Transforms raw Finnhub article to standardized format:

```typescript
{
  id: string; // Unique identifier
  headline: string; // Article title
  summary: string; // Article description
  image: string | null; // Featured image URL
  source: string; // News source
  url: string; // Article link
  datetime: number; // Unix timestamp
}
```

**Main Function:**

#### `getNews(symbols?: string[])`

**With Symbols (Company News):**

1. Fetches company news for each symbol
2. Round-robin through symbols (max 6 times)
3. Takes 1 valid article per symbol
4. Deduplicates by id/url/headline
5. Returns max 6 articles sorted by date (newest first)
6. Caches for 1 hour

**Without Symbols (General Market News):**

1. Fetches general market news
2. Deduplicates articles
3. Returns top 6
4. Caches for 1 hour

**Graceful Failure:** Throws `"Failed to fetch news"` if all attempts fail

---

### 5. `lib/inngest/functions.ts` (Updated)

**Purpose:** Automated daily news delivery

**Trigger:**

- 🕐 Cron: `0 12 * * *` (12 PM UTC daily)
- 📬 OR Event: `app/send.daily.news`

**Pipeline:**

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Get All Users                                   │
│ → getAllUsersForNewsEmail()                             │
│ → Returns: [{ id, email, name }, ...]                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: For Each User                                   │
│                                                          │
│  2a. Get watchlist symbols                              │
│      → getWatchlistSymbolsByEmail(email)                │
│      → Returns: ['AAPL', 'MSFT'] or []                 │
│                                                          │
│  2b. Fetch news                                         │
│      → getNews(symbols)                                 │
│      → Returns: FormattedArticle[] (max 6)              │
│                                                          │
│ → Result: UserWithNews[]                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Summarize News (PLACEHOLDER)                    │
│ → step.ai.infer() with Gemini                          │
│ → Personalized summaries per user                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Send Emails (PLACEHOLDER)                       │
│ → step.run() to send news summary emails               │
│ → Via nodemailer                                        │
└─────────────────────────────────────────────────────────┘
```

**Return Value:**

```typescript
{
  success: true,
  message: 'Daily news summary processed successfully',
  usersProcessed: number
}
```

---

## 🚀 Usage Examples

### Add Stock to Watchlist

```typescript
import { addToWatchlist } from '@/lib/actions/watchlist-management.actions';

const result = await addToWatchlist({
  userId: 'user123',
  symbol: 'AAPL',
  company: 'Apple Inc.',
});

console.log(result);
// { success: true, message: 'AAPL added to watchlist', data: {...} }
```

### Get User's Watchlist

```typescript
import { getUserWatchlist } from '@/lib/actions/watchlist-management.actions';

const result = await getUserWatchlist('user123');

console.log(result.data);
// [
//   { userId: 'user123', symbol: 'AAPL', company: 'Apple Inc.', addedAt: Date },
//   { userId: 'user123', symbol: 'MSFT', company: 'Microsoft Corp', addedAt: Date }
// ]
```

### Get News for Watchlist

```typescript
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';

// Get user's symbols
const symbols = await getWatchlistSymbolsByEmail('user@example.com');

// Fetch news for those symbols
const news = await getNews(symbols);

console.log(news);
// [
//   {
//     id: '...',
//     headline: 'Apple Reports Record Earnings',
//     summary: '...',
//     source: 'Reuters',
//     url: 'https://...',
//     datetime: 1234567890
//   },
//   ...
// ]
```

### Fetch General Market News

```typescript
import { getNews } from '@/lib/actions/finnhub.actions';

const generalNews = await getNews(); // No symbols = general news

console.log(generalNews);
// Array of 6 general market news articles
```

### Trigger Daily News Summary

```typescript
import { inngest } from '@/lib/inngest/client';

// Manual trigger (in addition to cron)
await inngest.send({
  name: 'app/send.daily.news',
  data: {},
});
```

---

## 🔑 Environment Variables

Required in `.env.local`:

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Finnhub API (get from https://finnhub.io)
NEXT_PUBLIC_FINNHUB_API_KEY=your_api_key

# Email (for nodemailer)
NODEMAILER_EMAIL=your-email@gmail.com
NODEMAILER_PASSWORD=app_specific_password

# Better Auth
BETTER_AUTH_SECRET=random_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Inngest / AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📊 Database

### Collection: `watchlist`

**Indexes:**

1. `userId` (single) - for queries by user
2. `{ userId: 1, symbol: 1 }` (compound, unique) - prevents duplicates

**Example Document:**

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "userId": "user123",
  "symbol": "AAPL",
  "company": "Apple Inc.",
  "addedAt": "2025-11-12T10:30:00Z"
}
```

---

## 🔄 Data Flow

### User Signup

```
1. User signs up with email
2. User profile created in Better Auth
3. User ID assigned
```

### Add to Watchlist

```
1. Frontend calls addToWatchlist({ userId, symbol, company })
2. Check if symbol already exists for user
3. If not, insert new document
4. Return success/error
```

### Daily News Delivery

```
1. Inngest cron triggers at 12 PM UTC
2. Load all users
3. For each user:
   - Get their watchlist symbols
   - Fetch news for those symbols
   - If no symbols, fetch general news
4. (TODO) Summarize news with AI
5. (TODO) Send personalized email
6. Return stats
```

---

## ✅ Type Safety

All functions have:

- ✅ Explicit return types
- ✅ Input interfaces
- ✅ No `any` types
- ✅ TypeScript strict mode compatible

---

## 🐛 Error Handling

**Strategy:** Fail gracefully

- Return empty array if user not found
- Return empty array if API fails
- Log errors for debugging
- Never throw unhandled errors

**Example:**

```typescript
try {
  // operation
} catch (error) {
  console.error('Error:', error);
  return []; // or default value
}
```

---

## 📝 TODOs

- [ ] Step 3: Implement AI news summarization in `sendDailyNewsSummary`
- [ ] Step 4: Implement email sending in `sendDailyNewsSummary`
- [ ] Create `NEWS_SUMMARY_EMAIL_TEMPLATE` in `lib/nodemailer/templates.ts`
- [ ] Create `sendNewsEmail()` function in `lib/nodemailer/index.ts`
- [ ] Add frontend UI for watchlist management
- [ ] Add unit tests for all functions
- [ ] Add rate limiting for API calls
- [ ] Implement user preference settings (email frequency, stock categories)

---

## 🧪 Testing

### Test getWatchlistSymbolsByEmail

```typescript
// Setup: Create user and watchlist items
// Test: Call with user email
// Assert: Returns correct symbols
```

### Test getNews

```typescript
// Test with symbols: Should return company news
// Test without symbols: Should return general news
// Assert: Max 6 articles, sorted by date
```

### Test addToWatchlist

```typescript
// Test: Add new symbol → success
// Test: Add duplicate → error
// Test: Invalid symbol → handled gracefully
```

---

## 🔗 Related Files

- User model: `lib/better-auth/auth.ts`
- Email templates: `lib/nodemailer/templates.ts`
- Inngest setup: `lib/inngest/client.ts`
- Utilities: `lib/utils.ts`

---

## 📚 References

- [Finnhub API Docs](https://finnhub.io/docs/api)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Inngest Functions](https://www.inngest.com/docs/functions)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
