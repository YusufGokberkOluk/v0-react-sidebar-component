// models/Page.ts
import mongoose, { Schema, Document, models, Model, Types } from 'mongoose';

// Notion benzeri blok tabanlı içerik için basit bir arayüz
// Bu yapıyı projenizin ihtiyaçlarına göre çok daha detaylandırabilirsiniz.
export interface IBlock extends Document {
  _id: Types.ObjectId; // Her blok için benzersiz ID
  type: string; // Örn: 'paragraph', 'heading1', 'list', 'image', 'code'
  content: any; // Metin, URL, liste elemanları dizisi vb. olabilir
  // order: number; // Blokların sayfa içindeki sırası için eklenebilir
}

const BlockSchema: Schema<IBlock> = new Schema({
  // _id alanı Mongoose tarafından otomatik eklenecektir, ama açıkça da tanımlayabiliriz.
  type: { type: String, required: true },
  content: { type: Schema.Types.Mixed, required: true }, // Herhangi bir tipte veri saklayabilir
  // order: { type: Number },
}, { _id: true }); // _id: true ile her alt doküman için ID oluşturulur

// Sayfa/Not verileri için arayüz
export interface IPage extends Document {
  title: string;
  contentBlocks?: IBlock[]; // Gömülü bloklar dizisi
  author: Types.ObjectId; // Bu sayfayı oluşturan kullanıcının ID'si (User modeline referans)
  workspace?: Types.ObjectId; // Sayfanın ait olduğu çalışma alanının ID'si (opsiyonel)
  parentId?: Types.ObjectId | null; // Hiyerarşik yapı için üst sayfanın ID'si
  isFavorite?: boolean;
  tags?: string[];
  // icon?: string; // Sayfa ikonu (emoji veya URL)
  // coverImage?: string; // Sayfa kapak resmi URL'si
  // Diğer Notion özellikleri eklenebilir...
}

// Sayfa/Not şeması
const PageSchema: Schema<IPage> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Sayfa başlığı gereklidir.'],
      trim: true,
    },
    contentBlocks: [BlockSchema], // BlockSchema'yı bir dizi olarak gömer
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User', // 'User' modeline bir referans oluşturur
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace', // 'Workspace' modeline referans (eğer bu modeli oluşturursanız)
      // required: false, // Opsiyonel olabilir
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Page', // Kendi kendine referans (sayfaların alt sayfaları olabilir)
      default: null,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    tags: [{ type: String, trim: true }],
    // icon: { type: String },
    // coverImage: { type: String },
  },
  {
    timestamps: true, // createdAt ve updatedAt alanlarını otomatik ekler
  }
);

// Modeli tekrar tekrar derlemeyi önle
const Page: Model<IPage> = models.Page || mongoose.model<IPage>('Page', PageSchema);

export default Page;
