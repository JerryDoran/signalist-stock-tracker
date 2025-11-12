# Watchlist System - Frontend Integration Guide

## Quick Start for Frontend

### 1. Add Stock to Watchlist (Button Component)

```typescript
// components/add-to-watchlist.tsx
'use client';

import { useState } from 'react';
import { addToWatchlist } from '@/lib/actions/watchlist-management.actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AddToWatchlistProps {
  userId: string;
  symbol: string;
  company: string;
}

export function AddToWatchlistButton({
  userId,
  symbol,
  company,
}: AddToWatchlistProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    try {
      setIsLoading(true);
      const result = await addToWatchlist({
        userId,
        symbol,
        company,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to add to watchlist');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleAdd} disabled={isLoading} variant='outline'>
      {isLoading ? 'Adding...' : 'Add to Watchlist'}
    </Button>
  );
}
```

### 2. Display User's Watchlist (List Component)

```typescript
// components/watchlist-display.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  getUserWatchlist,
  removeFromWatchlist,
} from '@/lib/actions/watchlist-management.actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WatchlistItem {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

interface WatchlistDisplayProps {
  userId: string;
}

export function WatchlistDisplay({ userId }: WatchlistDisplayProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, [userId]);

  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const result = await getUserWatchlist(userId);
      if (result.success && result.data) {
        setItems(result.data);
      }
    } catch (error) {
      toast.error('Failed to load watchlist');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    try {
      const result = await removeFromWatchlist(userId, symbol);
      if (result.success) {
        toast.success(result.message);
        await loadWatchlist();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to remove from watchlist');
      console.error(error);
    }
  };

  if (isLoading) {
    return <div>Loading watchlist...</div>;
  }

  if (items.length === 0) {
    return <div>No stocks in watchlist yet</div>;
  }

  return (
    <div className='space-y-2'>
      {items.map((item) => (
        <div
          key={item.symbol}
          className='flex items-center justify-between p-3 bg-slate-100 rounded'
        >
          <div>
            <div className='font-semibold'>{item.symbol}</div>
            <div className='text-sm text-gray-600'>{item.company}</div>
          </div>
          <Button
            onClick={() => handleRemove(item.symbol)}
            variant='ghost'
            size='sm'
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
```

### 3. Fetch News for Watchlist (Server Component)

```typescript
// components/watchlist-news.tsx
import { getWatchlistSymbolsByEmail } from '@/lib/actions/watchlist.actions';
import { getNews } from '@/lib/actions/finnhub.actions';
import Image from 'next/image';

interface WatchlistNewsProps {
  email: string;
}

export async function WatchlistNews({ email }: WatchlistNewsProps) {
  try {
    // Get user's watchlist symbols
    const symbols = await getWatchlistSymbolsByEmail(email);

    // Fetch news for those symbols (or general if none)
    const articles = await getNews(symbols.length > 0 ? symbols : undefined);

    if (articles.length === 0) {
      return <div>No news available</div>;
    }

    return (
      <div className='space-y-4'>
        {articles.map((article) => (
          <div key={article.id} className='border rounded p-4 hover:bg-gray-50'>
            {article.image && (
              <Image
                src={article.image}
                alt={article.headline}
                width={300}
                height={200}
                className='rounded mb-3 w-full h-auto'
              />
            )}
            <h3 className='font-semibold text-lg mb-2'>{article.headline}</h3>
            <p className='text-sm text-gray-600 mb-3'>{article.summary}</p>
            <div className='flex justify-between items-center'>
              <span className='text-xs text-gray-500'>
                {article.source} •{' '}
                {new Date(article.datetime * 1000).toLocaleDateString()}
              </span>
              <a
                href={article.url}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 text-sm hover:underline'
              >
                Read More →
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return <div>Failed to load news</div>;
  }
}
```

### 4. Full Page Example (Dashboard)

```typescript
// app/(main)/page.tsx
import { auth } from '@/lib/better-auth/auth';
import { WatchlistDisplay } from '@/components/watchlist-display';
import { WatchlistNews } from '@/components/watchlist-news';

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return <div>Please sign in</div>;
  }

  const user = session.user;

  return (
    <div className='space-y-8'>
      <h1 className='text-3xl font-bold'>Your Dashboard</h1>

      <section>
        <h2 className='text-2xl font-semibold mb-4'>My Watchlist</h2>
        <WatchlistDisplay userId={user.id} />
      </section>

      <section>
        <h2 className='text-2xl font-semibold mb-4'>Latest News</h2>
        <WatchlistNews email={user.email} />
      </section>
    </div>
  );
}
```

---

## API Routes (Optional)

If you need HTTP endpoints for external integrations:

### Create `/api/watchlist/add` Endpoint

```typescript
// app/api/watchlist/add/route.ts
import { addToWatchlist } from '@/lib/actions/watchlist-management.actions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, symbol, company } = body;

    if (!userId || !symbol || !company) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await addToWatchlist({
      userId,
      symbol,
      company,
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}
```

### Create `/api/news` Endpoint

```typescript
// app/api/news/route.ts
import { getNews } from '@/lib/actions/finnhub.actions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.getAll('symbol');

  try {
    const articles = await getNews(symbols.length > 0 ? symbols : undefined);
    return Response.json(articles);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
```

---

## Hook for Watchlist Management

```typescript
// hooks/useWatchlist.ts
'use client';

import { useState, useCallback } from 'react';
import {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
  isSymbolInWatchlist,
} from '@/lib/actions/watchlist-management.actions';

interface WatchlistItem {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

export function useWatchlist(userId: string) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWatchlist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getUserWatchlist(userId);
      if (result.success && result.data) {
        setItems(result.data);
      }
    } catch (err) {
      setError('Failed to load watchlist');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const add = useCallback(
    async (symbol: string, company: string) => {
      try {
        setError(null);
        const result = await addToWatchlist({
          userId,
          symbol,
          company,
        });
        if (result.success) {
          await loadWatchlist();
        } else {
          setError(result.message);
        }
        return result;
      } catch (err) {
        setError('Failed to add to watchlist');
        console.error(err);
      }
    },
    [userId, loadWatchlist]
  );

  const remove = useCallback(
    async (symbol: string) => {
      try {
        setError(null);
        const result = await removeFromWatchlist(userId, symbol);
        if (result.success) {
          await loadWatchlist();
        } else {
          setError(result.message);
        }
        return result;
      } catch (err) {
        setError('Failed to remove from watchlist');
        console.error(err);
      }
    },
    [userId, loadWatchlist]
  );

  const check = useCallback(
    async (symbol: string) => {
      try {
        return await isSymbolInWatchlist(userId, symbol);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [userId]
  );

  return {
    items,
    isLoading,
    error,
    loadWatchlist,
    add,
    remove,
    check,
  };
}
```

### Usage in Component

```typescript
'use client';

import { useEffect } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';

export function MyWatchlist({ userId }: { userId: string }) {
  const { items, isLoading, add, remove, loadWatchlist } = useWatchlist(userId);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  return (
    // Component JSX
  );
}
```

---

## Form for Adding Stocks

```typescript
// components/add-stock-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { addToWatchlist } from '@/lib/actions/watchlist-management.actions';
import { toast } from 'sonner';

interface AddStockFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function AddStockForm({ userId, onSuccess }: AddStockFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      symbol: '',
      company: '',
    },
  });

  const onSubmit = async (data: { symbol: string; company: string }) => {
    try {
      const result = await addToWatchlist({
        userId,
        ...data,
      });

      if (result.success) {
        toast.success(result.message);
        reset();
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to add stock');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
      <input
        {...register('symbol', { required: 'Symbol is required' })}
        placeholder='e.g., AAPL'
        className='w-full px-3 py-2 border rounded'
      />
      <input
        {...register('company', { required: 'Company name is required' })}
        placeholder='e.g., Apple Inc.'
        className='w-full px-3 py-2 border rounded'
      />
      <button
        type='submit'
        disabled={isSubmitting}
        className='w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
      >
        {isSubmitting ? 'Adding...' : 'Add to Watchlist'}
      </button>
    </form>
  );
}
```

---

## Testing in Browser DevTools

### Add to Watchlist

```javascript
// In browser console:
const result = await fetch('/api/watchlist/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    symbol: 'AAPL',
    company: 'Apple Inc.',
  }),
});
console.log(await result.json());
```

### Fetch News

```javascript
// In browser console:
const result = await fetch('/api/news?symbol=AAPL&symbol=MSFT');
console.log(await result.json());
```

---

## Common Patterns

### Loading States

```typescript
if (isLoading) return <Skeleton />;
if (error) return <Error message={error} />;
if (items.length === 0) return <Empty />;
```

### Error Handling

```typescript
try {
  const result = await addToWatchlist({...});
  if (result.success) {
    // Show success toast
  } else {
    // Show error toast from result.message
  }
} catch (error) {
  // Show generic error
}
```

### Conditional Rendering

```typescript
const isInWatchlist = items.some((item) => item.symbol === stock.symbol);

return (
  <Button variant={isInWatchlist ? 'default' : 'outline'}>
    {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
  </Button>
);
```

---

## Next Steps

1. Create watchlist page at `/app/(main)/watchlist/page.tsx`
2. Add watchlist widget to dashboard
3. Create stock search component to add stocks
4. Implement real-time updates with WebSockets (optional)
5. Add watchlist sharing features (optional)
6. Create watchlist alerts/notifications (optional)
