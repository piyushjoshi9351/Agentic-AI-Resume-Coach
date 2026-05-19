import React, { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'

export default function VoiceRecorder({ onTranscript, disabled = false }) {
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
    <div className="space-y-3 rounded-xl border border-dark-border bg-dark-bg/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-dark-muted">
          <Volume2 className="h-4 w-4 text-cyan-400" />
          <span>{isListening ? 'Listening...' : 'Use the mic to speak your answer'}</span>
        </div>
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            isListening
              ? 'border border-red-500/40 bg-red-500/10 text-red-200'
              : 'border border-purple-glow/40 bg-purple-glow/10 text-purple-200 hover:bg-purple-glow/20'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isListening ? 'Stop Mic' : 'Start Mic'}
        </button>
      </div>

      {liveText ? (
        <div className="rounded-lg border border-dark-border bg-dark-card/70 p-3 text-sm text-dark-text">
          {liveText}
        </div>
      ) : (
        <p className="text-xs text-dark-muted">Speak clearly after pressing start. The transcript will populate automatically.</p>
      )}
    </div>
  )
}