import mongoose from 'mongoose';

/**
  Global is used here to maintain a cached connection across hot reloads in development.
  This prevents connections growing exponentially during API Route execution.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

const DEFAULT_MONGODB_URI =
  'mongodb+srv://aaryarastogi0110_db_user:rR3xASJQLFVnU6L5@cluster0.xqowyei.mongodb.net/chatbot_ai?retryWrites=true&w=majority';

export async function connectToDatabase(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
