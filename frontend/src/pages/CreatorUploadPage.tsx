import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../auth'
import { api } from '../lib/api'

interface TestCase {
  input: string
  expectedOutput: string
}

export default function CreatorUploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form state
  const [videoTitle, setVideoTitle] = useState('')
  const [problemTitle, setProblemTitle] = useState('')
  const [problemDescription, setProblemDescription] = useState('')
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: '', expectedOutput: '' },
  ])
  const [videoFile, setVideoFile] = useState<File | null>(null)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate({ to: '/auth' })
    }
  }, [navigate, user])

  if (!user) {
    return null
  }

  // Handle test case changes
  const updateTestCase = (index: number, field: 'input' | 'expectedOutput', value: string) => {
    const updated = [...testCases]
    updated[index][field] = value
    setTestCases(updated)
  }

  // Add new test case
  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '' }])
  }

  // Remove test case
  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index))
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      setError('')
    } else {
      setError('Please select a valid video file (MP4, WebM, etc.)')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!videoTitle.trim()) {
      setError('Video title is required')
      return
    }
    if (!problemTitle.trim()) {
      setError('Problem title is required')
      return
    }
    if (!problemDescription.trim()) {
      setError('Problem description is required')
      return
    }
    if (!videoFile) {
      setError('Please select a video file')
      return
    }
    if (testCases.some((tc) => !tc.input.trim() || !tc.expectedOutput.trim())) {
      setError('All test cases must have input and expected output')
      return
    }

    setUploading(true)
    try {
      // Step 1: Get signed upload URL from backend
      const contentType = videoFile.type || 'video/mp4'
      const uploadUrlResponse = await api.get('/videos/upload-url', {
        params: { contentType },
      })
      const { uploadUrl, key } = uploadUrlResponse.data

      // Step 2: Upload video to S3 using XMLHttpRequest (supports progress tracking)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setUploadProgress(Math.round(percentComplete))
          }
        })

        xhr.addEventListener('load', resolve)
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', contentType)
        xhr.send(videoFile)
      })

      // Step 3: Confirm upload and save metadata in database
      await api.post('/videos/confirm', {
        title: videoTitle.trim(),
        problemTitle: problemTitle.trim(),
        description: problemDescription.trim(),
        authorId: user.id,
        fileKey: key,
        testCases,
      })

      setSuccess(true)
      setUploadProgress(0)

      // Redirect to feed after 2 seconds
      setTimeout(() => {
        navigate({ to: '/feed' })
      }, 2000)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Upload failed. Please try again.'
      setError(message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Create a Coding Tutorial
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload a video and add a coding problem for learners to solve
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="glass-card rounded-xl border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="glass-card rounded-xl border border-green-500/50 bg-green-500/10 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-green-500 text-sm">
                Tutorial uploaded successfully! Redirecting...
              </p>
            </div>
          )}

          {/* Video Upload Section */}
          <div className="glass-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Video Upload
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Video Title
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="e.g., Learn Array Sorting in JavaScript"
                className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Video File (MP4, WebM, etc.)
              </label>
              <div className="relative rounded-lg border-2 border-dashed border-border bg-secondary/20 p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  {videoFile ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{videoFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">
                        Drag video here or click to select
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: MP4, WebM, MOV
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && uploadProgress > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Uploading...
                  </span>
                  <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Problem Details Section */}
          <div className="glass-card rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Problem Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Problem Title
              </label>
              <input
                type="text"
                value={problemTitle}
                onChange={(e) => setProblemTitle(e.target.value)}
                placeholder="e.g., Bubble Sort Implementation"
                className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Problem Description
              </label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe the problem, constraints, and what learners need to implement..."
                rows={4}
                className="w-full rounded-lg border border-border bg-secondary/30 px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Test Cases Section */}
          <div className="glass-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Test Cases
              </h2>
              <button
                type="button"
                onClick={addTestCase}
                className="text-sm px-3 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              >
                + Add Test Case
              </button>
            </div>

            {testCases.map((testCase, index) => (
              <div key={index} className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Test Case {index + 1}
                  </span>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-xs px-2 py-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Input
                  </label>
                  <textarea
                    value={testCase.input}
                    onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                    placeholder="5\n3 2 8 1 9"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Expected Output
                  </label>
                  <textarea
                    value={testCase.expectedOutput}
                    onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                    placeholder="1 2 3 5 8 9"
                    rows={3}
                    className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Publish Tutorial'}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/feed' })}
              className="rounded-lg border border-border px-6 py-3 font-medium text-foreground hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
