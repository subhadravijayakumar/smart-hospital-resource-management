import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';

interface AudioDictationButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
}

export const AudioDictationButton: React.FC<AudioDictationButtonProps> = ({
  onTranscription,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { showToast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (base64Data) {
              const res = await api.transcribeAudio(base64Data, 'audio/webm');
              if (res.text) {
                onTranscription(res.text.trim());
                showToast('Clinical dictation transcribed successfully via Gemini.', 'success');
              } else {
                showToast('No audio transcribed.', 'warning');
              }
            }
            setIsProcessing(false);
          };
        } catch (err: unknown) {
          showToast(`Transcription error: ${(err as Error).message}`, 'error');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('Recording medical dictation... Speak clearly into microphone.', 'info');
    } catch (err) {
      showToast('Microphone access denied or not available.', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isProcessing}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
        isRecording
          ? 'bg-rose-600 text-white animate-pulse shadow-md'
          : isProcessing
          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
          : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
      } ${className}`}
      title={isRecording ? 'Click to stop recording and transcribe' : 'Dictate with microphone (Gemini Transcribe)'}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Transcribing...</span>
        </>
      ) : isRecording ? (
        <>
          <MicOff className="w-3.5 h-3.5" />
          <span>Stop Dictation</span>
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-teal-600" />
          <span>Dictate Voice</span>
        </>
      )}
    </button>
  );
};
