/**
 * Supabase Storage hooks — replaces Django MEDIA_ROOT file handling.
 */
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store'

interface UploadResult {
  path: string
  publicUrl: string | null
}

/**
 * Upload and manage files in Supabase Storage.
 */
export function useSupabaseStorage(bucket: string) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File, folder?: string): Promise<UploadResult | null> => {
      if (!user) {
        setError('Not authenticated')
        return null
      }

      setUploading(true)
      setProgress(0)
      setError(null)

      try {
        const ext = file.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${ext}`
        const path = folder
          ? `${folder}/${fileName}`
          : `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        setProgress(100)

        // Get signed URL with TTL (P1-S004: never use permanent public URLs)
        const { data: signedData } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 3600)
        const publicUrl = signedData?.signedUrl || ''

        return { path, publicUrl }
      } catch (err) {
        setError((err as Error).message)
        return null
      } finally {
        setUploading(false)
      }
    },
    [bucket, user]
  )

  const getSignedUrl = useCallback(
    async (path: string, expiresIn = 3600): Promise<string | null> => {
      const { data, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (signError) {
        setError(signError.message)
        return null
      }
      return data.signedUrl
    },
    [bucket]
  )

  const remove = useCallback(
    async (paths: string[]): Promise<boolean> => {
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove(paths)

      if (removeError) {
        setError(removeError.message)
        return false
      }
      return true
    },
    [bucket]
  )

  const list = useCallback(
    async (folder: string) => {
      const { data, error: listError } = await supabase.storage
        .from(bucket)
        .list(folder, { sortBy: { column: 'created_at', order: 'desc' } })

      if (listError) {
        setError(listError.message)
        return []
      }
      return data
    },
    [bucket]
  )

  return { upload, getSignedUrl, remove, list, uploading, progress, error }
}
