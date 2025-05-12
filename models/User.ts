// models/User.ts
import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Kullanıcı verileri için arayüz (TypeScript için)
export interface IUser extends Document {
  email: string;
  passwordHash: string; // Şifreyi asla düz metin olarak saklamayın!
  name?: string;
  // avatarUrl?: string; // Opsiyonel olarak eklenebilir
  // createdAt ve updatedAt Mongoose tarafından otomatik yönetilecek
}

// Kullanıcı şeması
const UserSchema: Schema<IUser> = new Schema(
  {
    email: {
      type: String,
      required: [true, 'E-posta adresi gereklidir.'],
      unique: true, // Her e-posta adresi benzersiz olmalı
      trim: true, // Baştaki ve sondaki boşlukları temizler
      lowercase: true, // E-postayı küçük harfe çevirir
      // Basit bir e-posta formatı doğrulaması
      match: [/.+\@.+\..+/, 'Lütfen geçerli bir e-posta adresi girin.'],
    },
    passwordHash: {
      // Şifreleri doğrudan saklamak yerine hash'lenmiş hallerini saklayacağız.
      // Bu alan, bcryptjs gibi bir kütüphane ile hash'lenmiş şifreyi tutacak.
      type: String,
      required: [true, 'Şifre gereklidir.'],
    },
    name: {
      type: String,
      trim: true,
    },
    // avatarUrl: {
    //   type: String,
    // },
  },
  {
    timestamps: true, // Bu seçenek, createdAt ve updatedAt alanlarını otomatik olarak ekler ve yönetir.
  }
);

// Modeli tekrar tekrar derlemeyi (compile) önlemek için bir kontrol ekliyoruz.
// Next.js geliştirme modunda dosyalar sık sık yeniden yüklendiği için bu önemlidir.
const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
