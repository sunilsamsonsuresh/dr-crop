import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://samstudio:AEXOoX6VvTMBb3ko@samstudio-prod.kky0eyj.mongodb.net/?retryWrites=true&w=majority&appName=samstudio-prod';
const DATABASE_NAME = 'dr-crop';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DATABASE_NAME);
    console.log('Connected to MongoDB');
  }
  return db;
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase() first.');
  }
  return db;
}