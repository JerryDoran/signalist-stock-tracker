import { connectToDatabase } from '@/database/mongoose';
import { email } from 'better-auth';

export async function getAllUsersForNewsEmail() {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error('MongoDB connection not found');

    const users = await db
      .collection('user')
      .find(
        {
          email: { $exists: true, $ne: null },
        },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();
    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user.id || user._id?.toString() || '',
        name: user.name,
        email: user.email,
      }));
  } catch (error) {
    console.error('Error fetching users for news email:', error);
    return [];
  }
}
