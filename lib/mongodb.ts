// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Lütfen MONGODB_URI ortam değişkenini .env.local dosyasında tanımlayın'
  );
}

/**
 * Global, geliştirme sırasında sıcak yeniden yüklemeler arasında önbelleğe alınmış bir bağlantıyı
 * sürdürmek için burada kullanılır. Bu, bağlantıların veritabanı bağlantı limitini
 * tüketmesini engeller.
 * Next.js'in geliştirme modundaki hızlı yenileme özelliği nedeniyle, bu önbellekleme
 * modeli her değişiklikte yeni bir bağlantı oluşturulmasını önler.
 */
// TypeScript'e global.mongoose'un var olabileceğini söylemek için:
// Mongoose tipini global scope'a genişletelim
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    // console.log('Önbelleğe alınmış MongoDB bağlantısı kullanılıyor.');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Mongoose 6+ için genellikle bu ayar önerilir
      // Diğer Mongoose bağlantı seçeneklerini buraya ekleyebilirsiniz
      // useNewUrlParser: true, // Eski sürümler için gerekli olabilir
      // useUnifiedTopology: true, // Eski sürümler için gerekli olabilir
    };

    // console.log('Yeni MongoDB bağlantısı oluşturuluyor.');
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongooseInstance) => {
      // console.log('MongoDB başarıyla bağlandı!');
      return mongooseInstance;
    }).catch(err => {
        console.error('MongoDB bağlantı hatası:', err);
        cached.promise = null; // Hata durumunda promise'i sıfırla ki tekrar denenebilsin
        throw err; // Hatanın yukarıya fırlatılması önemli
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Eğer bağlantı sırasında bir hata oluştuysa, promise'i sıfırla
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
