import { supabase, supabaseAdmin, PROFILE_PICTURES_BUCKET } from './supabase';

export async function setupSupabaseStorage() {
  if (!supabaseAdmin) {
    console.log('Supabase admin client not available. Please create the storage bucket manually in your Supabase dashboard.');
    return;
  }

  try {
    // Check if bucket exists using admin client
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === PROFILE_PICTURES_BUCKET);

    if (!bucketExists) {
      // Create the bucket using admin client
      const { data, error } = await supabaseAdmin.storage.createBucket(PROFILE_PICTURES_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });

      if (error) {
        console.error('Error creating bucket:', error);
      } else {
        console.log(`Bucket '${PROFILE_PICTURES_BUCKET}' created successfully`);
      }
    } else {
      console.log(`Bucket '${PROFILE_PICTURES_BUCKET}' already exists`);
    }
  } catch (error) {
    console.error('Error setting up Supabase storage:', error);
  }
}