'use server'

import { v2 as cloudinary } from 'cloudinary';
import { db } from '@/db';
import { recentExams } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('@')[1].split('.')[0] : '', 
  api_key: process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split('://')[1].split(':')[0] : '',
  api_secret: process.env.CLOUDINARY_URL ? process.env.CLOUDINARY_URL.split(':')[2].split('@')[0] : '',
});

// FIX 1: Explicitly type formData as FormData
export async function addExam(formData: FormData) {
  // FIX 2: Cast all FormData.get() results to string or File to satisfy Drizzle
  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const description = (formData.get('description') as string) || '';
  const url = formData.get('url') as string;
  
  const imageFile = formData.get('image') as File | null;
  const defaultImageUrl = formData.get('defaultImageUrl') as string;
  const examContentRaw = formData.get('examContent') as string | null;

  const totalQuestions = parseInt(formData.get('total_questions') as string) || 100;
  const rightMark = parseFloat(formData.get('right_mark') as string) || 1.0;
  const wrongMark = parseFloat(formData.get('wrong_mark') as string) || 0.0;

  if (!name || !url) {
    return { success: false, message: 'Missing required fields (Name or URL)' };
  }

  try {
    let finalImageUrl = defaultImageUrl;

    // Upload to Cloudinary ONLY if a new file was manually selected
    if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'exams' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });
      finalImageUrl = uploadResult.secure_url;
    }

    // Parse the JSON content
    let parsedContent = null;
    if (examContentRaw) {
      try {
        parsedContent = JSON.parse(examContentRaw);
      } catch (e) {
        console.error("Failed to parse exam content JSON", e);
      }
    }

    // Save to Neon DB
    await db.insert(recentExams).values({
      examName: name,
      type: type,
      description: description,
      imageUrl: finalImageUrl, 
      url: url,
      totalQuestions: totalQuestions,
      rightMark: rightMark,
      wrongMark: wrongMark,
      examContent: parsedContent, 
    });

    revalidatePath('/');
    return { success: true, message: 'Answer Key published successfully!' };

  } catch (error: any) {
    console.error('Add Exam Error:', error);
    if (error.code === '23505') {
       return { success: false, message: 'This URL slug already exists. Please choose a unique one.' };
    }
    return { success: false, message: 'Failed to create entry. Please try again.' };
  }
}

// FIX 3: Type formData here as well
export async function uploadEditorImage(formData: FormData) {
  try {
    const file = formData.get('image') as File | null;
    if (!file) throw new Error('No image file provided');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const uploadResult: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'exam_content' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return {
      success: 1,
      file: {
        url: uploadResult.secure_url,
      }
    };
  } catch (error) {
    console.error('Editor Image Upload Error:', error);
    return { success: 0, message: 'Upload failed' };
  }
}


export async function getExams() {
  try {
    const data = await db.query.recentExams.findMany({
      orderBy: [desc(recentExams.createdAt)],
    });
    return data;
  } catch (error) {
    console.error('Fetch Error:', error);
    return [];
  }
}

export async function deleteExam(id: number) {
  try {
    await db.delete(recentExams).where(eq(recentExams.id, id));
    revalidatePath('/');
    return { success: true, message: 'Answer Key deleted successfully' }; 
  } catch (e) {
    console.error('Delete Error:', e);
    return { success: false, message: 'Failed to delete Answer Key' }; 
  }
}