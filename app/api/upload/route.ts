import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAuthUser } from '@/lib/auth-utils';

cloudinary.config({
  secure: true,
  // ensure CLOUDINARY_URL is automatically picked up from environment
});

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const slug = formData.get('slug') as string;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    if (!slug) {
       return NextResponse.json({ error: 'Slug da barbearia não fornecido' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;
    
    let folder = `barbershop/${slug}`;
    if (type) {
      folder += `/${type}`;
    }

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    console.error('Erro no upload para Cloudinary:', error);
    return NextResponse.json({ error: 'Falha no upload da imagem' }, { status: 500 });
  }
}
