import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export function VoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for visual feedback
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsListening(true);
      
      // Start audio level monitoring
      monitorAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // TODO: Show error toast
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsListening(false);
      setAudioLevel(0);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!isListening) return;
      
      analyserRef.current?.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average);
      
      requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert audio to text using your backend
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/voice/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await import('@/lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const data = await response.json();
      setTranscript(data.text || '');
      
      // TODO: Send transcript to chat
      console.log('Transcribed text:', data.text);
    } catch (error) {
      console.error('Error processing audio:', error);
      // TODO: Show error toast
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Use TTS service via your backend for better quality
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/voice/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
        },
        body: JSON.stringify({
          text,
          voice: 'alloy', // or other voice options
          speed: 1.0,
        }),
      });
      
      if (!response.ok) {
        throw new Error('TTS failed');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setIsSpeaking(false);
      // TODO: Show error toast
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mic className="w-4 h-4" />
          Voice Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Audio Visualization */}
          <Card>
            <CardContent className="p-6 text-center">
              <div
                className={cn(
                  "w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-200",
                  isListening
                    ? "bg-red-500 text-white scale-110"
                    : "bg-muted text-muted-foreground",
                  isProcessing && "animate-pulse"
                )}
                style={{
                  transform: isListening
                    ? `scale(${1.1 + (audioLevel / 255) * 0.3})`
                    : 'scale(1)',
                }}
              >
                {isProcessing ? (
                  <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </div>
              
              {isListening && (
                <div className="mt-4">
                  <Progress value={(audioLevel / 255) * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Listening...
                  </p>
                </div>
              )}
              
              {isProcessing && (
                <p className="text-sm text-muted-foreground mt-4">
                  Processing audio...
                </p>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className="gap-2"
            >
              {isListening ? (
                <>
                  <Square className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Start
                </>
              )}
            </Button>

            <Button
              onClick={isSpeaking ? stopSpeaking : () => speakText('Hello, how can I help you today?')}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  Test TTS
                </>
              )}
            </Button>
          </div>

          {/* Transcript */}
          {transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{transcript}</p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => {
                    // TODO: Send transcript to chat
                    setIsOpen(false);
                  }}
                >
                  Send to Chat
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Click Start to begin voice recording</p>
              <p>• Speak clearly into your microphone</p>
              <p>• Click Stop when finished</p>
              <p>• Your speech will be converted to text</p>
              <p>• AI responses can be read aloud</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}