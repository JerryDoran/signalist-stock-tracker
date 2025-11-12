'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist, WatchlistItem } from '@/database/models/watchlist.model';

interface AddToWatchlistInput {
  userId: string;
  symbol: string;
  company: string;
}

interface WatchlistResponse {
  success: boolean;
  message: string;
  data?: WatchlistItem;
}

/**
 * Add a stock to user's watchlist
 * Returns error if symbol already exists for user
 */
export async function addToWatchlist(
  input: AddToWatchlistInput
): Promise<WatchlistResponse> {
  try {
    await connectToDatabase();

    const existingItem = await Watchlist.findOne({
      userId: input.userId,
      symbol: input.symbol.toUpperCase().trim(),
    });

    if (existingItem) {
      return {
        success: false,
        message: `${input.symbol} is already in your watchlist`,
      };
    }

    const newItem = new Watchlist({
      userId: input.userId,
      symbol: input.symbol.toUpperCase().trim(),
      company: input.company.trim(),
      addedAt: new Date(),
    });

    const saved = await newItem.save();

    return {
      success: true,
      message: `${input.symbol} added to watchlist`,
      data: saved,
    };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return {
      success: false,
      message: 'Failed to add to watchlist',
    };
  }
}

/**
 * Remove a stock from user's watchlist
 */
export async function removeFromWatchlist(
  userId: string,
  symbol: string
): Promise<WatchlistResponse> {
  try {
    await connectToDatabase();

    const result = await Watchlist.findOneAndDelete(
      {
        userId,
        symbol: symbol.toUpperCase().trim(),
      },
      { returnDocument: 'before' }
    );

    if (!result) {
      return {
        success: false,
        message: `${symbol} not found in watchlist`,
      };
    }

    return {
      success: true,
      message: `${symbol} removed from watchlist`,
      data: result,
    };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return {
      success: false,
      message: 'Failed to remove from watchlist',
    };
  }
}

interface WatchlistItemResponse {
  success: boolean;
  message: string;
  data?: Array<{
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
  }>;
}

/**
 * Get all watchlist items for a user (with full details)
 */
export async function getUserWatchlist(
  userId: string
): Promise<WatchlistItemResponse> {
  try {
    await connectToDatabase();

    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 });

    return {
      success: true,
      message: `Found ${items.length} items in watchlist`,
      data: items as unknown as Array<{
        userId: string;
        symbol: string;
        company: string;
        addedAt: Date;
      }>,
    };
  } catch (error) {
    console.error('Error fetching user watchlist:', error);
    return {
      success: false,
      message: 'Failed to fetch watchlist',
    };
  }
}

/**
 * Check if a symbol is already in user's watchlist
 */
export async function isSymbolInWatchlist(
  userId: string,
  symbol: string
): Promise<boolean> {
  try {
    await connectToDatabase();

    const item = await Watchlist.findOne({
      userId,
      symbol: symbol.toUpperCase().trim(),
    });

    return !!item;
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}
