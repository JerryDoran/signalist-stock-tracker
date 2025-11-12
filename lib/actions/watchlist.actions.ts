'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

export async function getWatchlistSymbolsByEmail(
  email: string
): Promise<string[]> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('MongoDB connection not found');
    }

    // Find user by email in the user collection
    const user = await db.collection('user').findOne({ email });

    if (!user) {
      console.log(`No user found with email: ${email}`);
      return [];
    }

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) {
      console.error('User ID not found');
      return [];
    }

    // Query watchlist by userId and return symbols
    const watchlistItems = await Watchlist.find(
      { userId },
      { symbol: 1 }
    ).lean();

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error('Error fetching watchlist symbols:', error);
    return [];
  }
}
