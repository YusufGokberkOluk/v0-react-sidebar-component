// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb'; // Oluşturduğumuz MongoDB bağlantı fonksiyonu
import User from '@/models/User';      // User modelimiz
import bcrypt from 'bcryptjs';         // Şifre hashleme için (bunu kurmuştuk)

// POST isteğini işleyecek fonksiyon
export async function POST(req: NextRequest) {
  try {
    // 1. Veritabanına bağlan
    await dbConnect();

    // 2. İstek gövdesinden kullanıcı bilgilerini al
    const { email, password, name } = await req.json();

    // 3. Gerekli alanların kontrolü
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'E-posta ve şifre alanları zorunludur.' },
        { status: 400 } // Bad Request
      );
    }

    // 4. Şifre uzunluğu kontrolü (opsiyonel ama önerilir)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Şifre en az 6 karakter olmalıdır.' },
        { status: 400 }
      );
    }

    // 5. Kullanıcının e-posta adresiyle zaten kayıtlı olup olmadığını kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 409 } // Conflict
      );
    }

    // 6. Şifreyi hash'le
    const saltRounds = 10; // Hash'leme için salt tur sayısı
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 7. Yeni kullanıcı nesnesi oluştur
    const newUser = new User({
      email,
      passwordHash, // Orijinal şifre yerine hash'lenmiş şifreyi kaydet
      name, // İsim opsiyonel olduğu için undefined olabilir
    });

    // 8. Yeni kullanıcıyı veritabanına kaydet
    await newUser.save();

    // 9. Başarılı yanıt döndür
    // Not: Gerçek uygulamada kullanıcıya token vb. döndürmek isteyebilirsiniz.
    return NextResponse.json(
      {
        success: true,
        message: 'Kullanıcı başarıyla oluşturuldu.',
        // Güvenlik nedeniyle şifre hash'ini veya tüm kullanıcı nesnesini döndürmeyin.
        // Sadece gerekli bilgileri (örn: kullanıcı ID'si) döndürebilirsiniz.
        user: { id: newUser._id, email: newUser.email, name: newUser.name },
      },
      { status: 201 } // Created
    );

  } catch (error: any) {
    console.error('Kayıt olma API hatası:', error);

    // Hata mesajlarını daha kullanıcı dostu hale getirelim
    let errorMessage = 'Sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
    let statusCode = 500;

    if (error.name === 'ValidationError') {
      // Mongoose şema doğrulama hataları
      const messages = Object.values(error.errors).map((err: any) => err.message);
      errorMessage = `Doğrulama hatası: ${messages.join(', ')}`;
      statusCode = 400;
    } else if (error.code === 11000) {
      // MongoDB duplicate key error (e-posta zaten kayıtlı)
      errorMessage = 'Bu e-posta adresi zaten kayıtlı.';
      statusCode = 409;
    }

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}
