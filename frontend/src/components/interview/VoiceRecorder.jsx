import React, { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'

export default function VoiceRecorder({ onTranscript, onListeningChange, disabled = false }) {
  const recognitionRef = useRef(null)
  const transcriptRef = useRef('')
  const [isListening, setIsListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [liveText, setLiveText] = useState('')

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return undefined
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      let interimText = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript
        if (event.results[index].isFinal) {
          transcriptRef.current = `${transcriptRef.current} ${transcript}`.trim()
        } else {
          interimText += transcript
        }
      }

      const combinedText = `${transcriptRef.current} ${interimText}`.trim()
      setLiveText(combinedText)
      if (combinedText) {
        onTranscript?.(combinedText)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [onTranscript, liveText])

  useEffect(() => {
    onListeningChange?.(isListening)
  }, [isListening, onListeningChange])

  const toggleListening = () => {
    if (!recognitionRef.current || disabled || !supported) {
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    transcriptRef.current = ''
    setLiveText('')
    setIsListening(true)
    recognitionRef.current.start()
  }

  if (!supported) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
        Voice input is not supported in this browser. You can still type your answer.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Volume2 className="h-4 w-4 text-cyan-300" />
          <span>{isListening ? 'Listening in real time' : 'Use the mic to speak your answer'}</span>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isListening ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300'}`}>
          {isListening ? 'Mic live' : 'Mic idle'}
        </span>
      </div>

      <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-black/10 to-blue-500/10 p-6">
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
          className={`relative flex h-24 w-24 items-center justify-center rounded-full border text-white shadow-[0_0_0_0_rgba(124,58,237,0.45)] transition-all duration-300 ${
            isListening
              ? 'border-red-400/50 bg-red-500/15 shadow-[0_0_0_0_rgba(248,113,113,0.5)] animate-pulse-glow'
              : 'border-purple-400/40 bg-gradient-to-br from-purple-500 to-blue-500 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(124,58,237,0.45)]'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <span className={`absolute inset-0 rounded-full ${isListening ? 'animate-ping bg-red-400/20' : 'bg-white/0'}`} />
          {isListening ? <MicOff className="relative h-9 w-9" /> : <Mic className="relative h-9 w-9" />}
        </button>
      </div>

      <div className="flex items-end justify-center gap-1 py-1" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className={`w-1.5 rounded-full ${isListening ? 'bg-gradient-to-t from-purple-400 to-blue-400 animate-pulse' : 'bg-white/15'}`}
            style={{
              height: `${12 + ((index % 4) * 10)}px`,
              animationDelay: `${index * 120}ms`,
            }}
          />
        ))}
      </div>

      {liveText ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100 shadow-inner shadow-black/20">
          {liveText}
        </div>
      ) : (
        <p className="text-xs text-slate-400">Speak clearly after pressing start. The transcript will populate automatically.</p>
      )}
    </div>
  )
}