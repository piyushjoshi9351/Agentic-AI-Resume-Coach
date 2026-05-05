import React, { useRef, useState } from 'react'
import { Upload, File, X, CheckCircle2 } from 'lucide-react'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export default function ResumeUpload({ resumeFile, setResumeFile, error, onValidationError }) {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const validateAndSetFile = (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      onValidationError?.('Only PDF files are allowed')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onValidationError?.('File size must be 5MB or less')
      return
    }
    onValidationError?.('')
    setResumeFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleRemove = () => {
    setResumeFile(null)
    onValidationError?.('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="animate-fadeInLeft">
      <label className="block text-sm font-semibold text-dark-text mb-4">Resume (PDF)</label>

      {!resumeFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 min-h-[220px] transition-all duration-300 cursor-pointer touch-manipulation ${
            isDragOver
              ? 'border-purple-glow bg-purple-glow/10 scale-105'
              : 'border-dark-border hover:border-purple-glow bg-dark-card/50 hover:bg-dark-card'
          }`}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 p-4 bg-gradient-to-br from-purple-glow/20 to-blue-glow/20 rounded-xl">
              <Upload className={`w-8 h-8 transition-all duration-300 ${isDragOver ? 'w-10 h-10 text-purple-glow' : 'text-dark-muted'}`} />
            </div>
            <p className="text-dark-text font-semibold mb-1">Drag your PDF resume here</p>
            <p className="text-dark-muted text-sm">or tap to browse · Max 5MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative border-2 border-purple-glow/50 bg-gradient-to-br from-purple-glow/5 to-blue-glow/5 rounded-2xl p-6 animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-glow to-blue-glow rounded-lg">
                <File className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-dark-text truncate max-w-xs">{resumeFile.name}</p>
                <p className="text-sm text-dark-muted">{formatFileSize(resumeFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500 animate-pulse" />
              <button
                onClick={handleRemove}
                className="p-2 hover:bg-dark-border rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-dark-muted hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-slideDown">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
