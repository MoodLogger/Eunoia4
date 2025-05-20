
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  hasRecognitionSupport: boolean;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
}

const useSpeechRecognition = (lang: string = 'pl-PL'): SpeechRecognitionHook => {
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

  const hasRecognitionSupport = !!SpeechRecognitionAPI;

  const requestMicrophonePermission = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('unavailable');
      setError('Dostęp do mikrofonu nie jest wspierany przez tę przeglądarkę.');
      return false;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionStatus('granted');
      return true;
    } catch (err) {
      setPermissionStatus('denied');
      setError('Odmówiono dostępu do mikrofonu. Sprawdź ustawienia przeglądarki.');
      console.error('Speech recognition permission denied:', err);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!hasRecognitionSupport) {
      setPermissionStatus('unavailable');
      setError('Rozpoznawanie mowy nie jest wspierane przez tę przeglądarkę.');
      return;
    }

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((status) => {
          setPermissionStatus(status.state);
          status.onchange = () => setPermissionStatus(status.state);
        })
        .catch(() => {
          setPermissionStatus('prompt'); // Fallback if query fails
        });
    }
  }, [hasRecognitionSupport]);

  const startListening = useCallback(async () => {
    if (!hasRecognitionSupport) return;
    if (isListening) return;

    if (permissionStatus !== 'granted') {
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;
    }

    setIsListening(true);
    setError(null);
    setAccumulatedTranscript(''); // Reset transcript for new session
    setInterimTranscript('');

    const recognition = new SpeechRecognitionAPI!();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true; // Keeps listening until explicitly stopped or error

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final_segment = '';
      let interim_segment = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_segment += event.results[i][0].transcript;
        } else {
          interim_segment += event.results[i][0].transcript;
        }
      }
      if (final_segment) {
        setAccumulatedTranscript(prev => (prev ? prev + ' ' : '') + final_segment.trim());
      }
      setInterimTranscript(interim_segment);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errMessage = `Błąd rozpoznawania: ${event.error}.`;
      if (event.error === 'no-speech') errMessage = 'Nie wykryto mowy. Spróbuj ponownie.';
      if (event.error === 'audio-capture') errMessage = 'Problem z mikrofonem. Sprawdź ustawienia.';
      if (event.error === 'not-allowed') errMessage = 'Brak uprawnień do mikrofonu. Zezwól w ustawieniach przeglądarki.';
      setError(errMessage);
      setIsListening(false); // Ensure listening stops on error
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      // recognitionRef.current = null; // Don't nullify here, stopListening will do it
    };

    recognition.start();
  }, [hasRecognitionSupport, isListening, lang, SpeechRecognitionAPI, permissionStatus, requestMicrophonePermission]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will set isListening to false and clear interimTranscript
    }
    if (recognitionRef.current) {
         recognitionRef.current = null; // Ensure it's cleared
    }
    setIsListening(false); // Force set if not already false
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setAccumulatedTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript: accumulatedTranscript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    hasRecognitionSupport,
    error,
    permissionStatus,
  };
};

export default useSpeechRecognition;
