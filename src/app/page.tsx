
"use client";

import * as React from 'react';
import Image from 'next/image';
import { format, isValid, parseISO } from 'date-fns';
// import { pl } from 'date-fns/locale'; // Assuming Polish locale for formatting
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeAssessment } from '@/components/theme-assessment';
import { MoodAnalysis } from '@/components/mood-analysis';
import { CalculatedMoodDisplay } from '@/components/calculated-mood-display';
import { saveDailyEntry, getDailyEntry, calculateOverallScores } from '@/lib/storage';
import type { DailyEntry, Mood, ThemeScores, DetailedThemeScores, QuestionScore } from '@/lib/types';
import type { LucideIcon } from 'lucide-react';
import { Frown, Meh, Smile, Loader2, BookText, ThumbsUp, ThumbsDown, CalendarDays, Mic, MicOff } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { useToast } from "@/hooks/use-toast";


type CalculatedMoodCategory = 'Bad' | 'Normal' | 'Good' | 'Obliczanie...';
interface CalculatedMoodState {
    icon: LucideIcon | null;
    label: CalculatedMoodCategory;
    totalScore: number | null;
}

const calculateMoodFromOverallScores = (scores: ThemeScores | undefined): CalculatedMoodState => {
    if (!scores) return { icon: Loader2, label: 'Obliczanie...', totalScore: null };
    const themeKeys = Object.keys(scores) as Array<keyof ThemeScores>;
    const sum = themeKeys.reduce((acc, key) => acc + (scores[key] ?? 0), 0);
    const count = themeKeys.length;
    const average = count > 0 ? sum / count : 0;
    const badThreshold = -0.75;
    const goodThreshold = 0.75;

    let polishLabel: CalculatedMoodCategory = 'Obliczanie...';
    if (average <= badThreshold) polishLabel = 'Bad';
    else if (average >= goodThreshold) polishLabel = 'Good';
    else polishLabel = 'Normal';

    if (average <= badThreshold) return { icon: Frown, label: polishLabel, totalScore: parseFloat(sum.toFixed(2)) };
    if (average >= goodThreshold) return { icon: Smile, label: polishLabel, totalScore: parseFloat(sum.toFixed(2)) };
    return { icon: Meh, label: polishLabel, totalScore: parseFloat(sum.toFixed(2)) };
};

export default function Home() {
  const [selectedDate, setSelectedDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dailyEntry, setDailyEntry] = React.useState<DailyEntry | null>(null);
  const [calculatedMood, setCalculatedMood] = React.useState<CalculatedMoodState>({ icon: Loader2, label: 'Obliczanie...', totalScore: null });
  const [isClient, setIsClient] = React.useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = React.useState(true);
  const [logoVersion, setLogoVersion] = React.useState(Date.now());
  const { toast } = useToast();

  const positivesSpeech = useSpeechRecognition();
  const negativesSpeech = useSpeechRecognition();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (isClient) {
      setIsLoadingEntry(true);
      const dateObj = parseISO(selectedDate);
      if (!isValid(dateObj)) {
        console.warn("Invalid date selected: " + selectedDate + ". Defaulting to today.");
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setIsLoadingEntry(false);
        return;
      }

      getDailyEntry(selectedDate).then(entry => {
        setDailyEntry(entry);
        setCalculatedMood(calculateMoodFromOverallScores(entry.scores));
        setIsLoadingEntry(false);
      }).catch(err => {
        console.error("Error fetching daily entry:", err);
        setDailyEntry(null);
        setIsLoadingEntry(false);
      });
    }
  }, [isClient, selectedDate]);

  React.useEffect(() => {
    if (dailyEntry && isClient && selectedDate && dailyEntry.date === selectedDate && !isLoadingEntry) {
      saveDailyEntry(dailyEntry).catch(err => {
        console.error("Error saving daily entry:", err);
      });
    }
  }, [dailyEntry, isClient, selectedDate, isLoadingEntry]);

   const handleQuestionScoreChange = (
       theme: keyof ThemeScores,
       questionIndex: number,
       value: QuestionScore
   ) => {
       setDailyEntry((prevEntry) => {
           if (!prevEntry) return null;
           const newDetailedScores = JSON.parse(JSON.stringify(prevEntry.detailedScores)) as DetailedThemeScores;
           if (!newDetailedScores[theme]) newDetailedScores[theme] = {};
           newDetailedScores[theme][questionIndex] = value;
           const newOverallScores = calculateOverallScores(newDetailedScores);
           setCalculatedMood(calculateMoodFromOverallScores(newOverallScores));
           return {
               ...prevEntry,
               scores: newOverallScores,
               detailedScores: newDetailedScores,
           };
       });
   };

   const handleNotesChange = (field: 'positives' | 'negatives', value: string) => {
    setDailyEntry((prevEntry) => {
        if (!prevEntry) return null;
        return {
            ...prevEntry,
            [field]: value,
        };
    });
   };

    React.useEffect(() => {
        if (!positivesSpeech.isListening && positivesSpeech.transcript) {
            setDailyEntry((prevEntry) => {
                if (!prevEntry) return null;
                const currentText = prevEntry.positives || '';
                const newText = currentText + (currentText ? ' ' : '') + positivesSpeech.transcript;
                positivesSpeech.clearTranscript();
                return { ...prevEntry, positives: newText.trim() };
            });
        }
    }, [positivesSpeech.isListening, positivesSpeech.transcript, positivesSpeech.clearTranscript]);

    React.useEffect(() => {
        if (!negativesSpeech.isListening && negativesSpeech.transcript) {
            setDailyEntry((prevEntry) => {
                if (!prevEntry) return null;
                const currentText = prevEntry.negatives || '';
                const newText = currentText + (currentText ? ' ' : '') + negativesSpeech.transcript;
                negativesSpeech.clearTranscript();
                return { ...prevEntry, negatives: newText.trim() };
            });
        }
    }, [negativesSpeech.isListening, negativesSpeech.transcript, negativesSpeech.clearTranscript]);
    
    React.useEffect(() => {
        if (positivesSpeech.error) {
            toast({ variant: "destructive", title: "Błąd nagrywania (Pozytywy)", description: positivesSpeech.error });
        }
    }, [positivesSpeech.error, toast]);

    React.useEffect(() => {
        if (negativesSpeech.error) {
            toast({ variant: "destructive", title: "Błąd nagrywania (Negatywy)", description: negativesSpeech.error });
        }
    }, [negativesSpeech.error, toast]);


   const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(format(date, 'yyyy-MM-dd'));
      setLogoVersion(Date.now());
    }
  };

  if (isLoadingEntry && isClient) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Ładowanie Eunoia...
          </p>
        </main>
      );
  }

  if (!isClient || !dailyEntry) {
     return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md space-y-6">
                <Card className="shadow-lg animate-pulse">
                    <CardHeader className="text-center flex flex-col items-center">
                        <div className="h-40 w-32 bg-muted rounded mx-auto mb-4"></div>
                        <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                        <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-4 space-y-2">
                         <div className="h-16 w-16 bg-muted rounded-full"></div>
                         <div className="h-4 bg-muted rounded w-1/4"></div>
                         <div className="h-4 bg-muted rounded w-1/6 mt-1"></div>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg animate-pulse">
                     <CardHeader> <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div> </CardHeader>
                    <CardContent className="space-y-4 p-6">
                          {[...Array(7)].map((_, i) => (
                           <div key={i} className="space-y-2 rounded-md border p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="h-4 bg-muted rounded w-1/3"></div>
                                    <div className="h-4 bg-muted rounded w-1/6"></div>
                                </div>
                                <div className="h-2 bg-muted rounded w-full"></div>
                           </div>
                         ))}
                     </CardContent>
                </Card>
                 <Card className="shadow-lg animate-pulse">
                     <CardHeader>
                         <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div>
                         <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4 p-6">
                         <div className="h-10 bg-muted rounded w-1/2"></div>
                         <div className="h-10 bg-muted rounded w-1/2"></div>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg animate-pulse">
                    <CardHeader> <div className="h-6 bg-muted rounded w-1/2 mx-auto mb-2"></div> </CardHeader>
                     <CardContent className="space-y-4 p-6">
                        <div className="h-20 bg-muted rounded w-full"></div>
                        <div className="h-20 bg-muted rounded w-full"></div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 pt-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center flex flex-col items-center pb-2">
            <Image
              src={`/eunoia-logo.png?v=${logoVersion}`}
              alt="Eunoia Logo"
              width={160}
              height={200}
              priority
              className="mb-2"
              data-ai-hint="brain logo"
            />
            <CardDescription className="flex flex-row items-center justify-center space-x-2 w-full mt-2">
              <Label htmlFor="date-picker-button" className="text-base font-medium">Data:</Label>
              <DatePicker
                id="date-picker-button"
                date={selectedDate ? parseISO(selectedDate) : new Date()}
                onDateChange={handleDateChange}
                className="w-auto"
              />
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
             <CalculatedMoodDisplay
                 icon={calculatedMood.icon}
                 label={calculatedMood.label}
                 totalScore={calculatedMood.totalScore}
            />
          </CardContent>
        </Card>

        <ThemeAssessment
          scores={dailyEntry.scores}
          detailedScores={dailyEntry.detailedScores}
          onQuestionScoreChange={handleQuestionScoreChange}
        />

        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <BookText className="mr-2 h-5 w-5 text-primary" /> Notatki Dnia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="relative">
              <Label htmlFor="positives-notes" className="flex items-center mb-1 text-green-600 dark:text-green-400">
                <ThumbsUp className="mr-2 h-4 w-4" /> Pozytywy
              </Label>
              <Textarea
                id="positives-notes"
                placeholder="Co dobrego się dzisiaj wydarzyło? Jakie pozytywne myśli Ci towarzyszyły?"
                value={dailyEntry.positives || ''}
                onChange={(e) => handleNotesChange('positives', e.target.value)}
                className="min-h-[100px] border-green-300 focus:border-green-500 focus:ring-green-500 pr-10"
              />
              {positivesSpeech.hasRecognitionSupport && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute bottom-2 right-1 h-8 w-8"
                  onClick={positivesSpeech.isListening ? positivesSpeech.stopListening : positivesSpeech.startListening}
                  title={positivesSpeech.isListening ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie (Pozytywy)"}
                  disabled={positivesSpeech.permissionStatus === 'denied'}
                >
                  {positivesSpeech.isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
            </div>
            {positivesSpeech.interimTranscript && positivesSpeech.isListening && (
                <p className="text-xs text-muted-foreground">Słucham (Pozytywy): <em>{positivesSpeech.interimTranscript}</em></p>
            )}
            {positivesSpeech.permissionStatus === 'denied' && <p className="text-xs text-red-500 mt-1">Odmówiono dostępu do mikrofonu dla pola 'Pozytywy'.</p>}
            {!positivesSpeech.hasRecognitionSupport && <p className="text-xs text-muted-foreground mt-1">Rozpoznawanie mowy nie jest wspierane.</p>}


            <div className="relative">
              <Label htmlFor="negatives-notes" className="flex items-center mb-1 text-red-600 dark:text-red-400">
                <ThumbsDown className="mr-2 h-4 w-4" /> Negatywy
              </Label>
              <Textarea
                id="negatives-notes"
                placeholder="Co poszło nie tak? Jakie negatywne myśli lub emocje się pojawiły?"
                value={dailyEntry.negatives || ''}
                onChange={(e) => handleNotesChange('negatives', e.target.value)}
                className="min-h-[100px] border-red-300 focus:border-red-500 focus:ring-red-500 pr-10"
              />
               {negativesSpeech.hasRecognitionSupport && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute bottom-2 right-1 h-8 w-8"
                  onClick={negativesSpeech.isListening ? negativesSpeech.stopListening : negativesSpeech.startListening}
                  title={negativesSpeech.isListening ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie (Negatywy)"}
                  disabled={negativesSpeech.permissionStatus === 'denied'}
                >
                  {negativesSpeech.isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
            </div>
            {negativesSpeech.interimTranscript && negativesSpeech.isListening && (
                <p className="text-xs text-muted-foreground">Słucham (Negatywy): <em>{negativesSpeech.interimTranscript}</em></p>
            )}
            {negativesSpeech.permissionStatus === 'denied' && <p className="text-xs text-red-500 mt-1">Odmówiono dostępu do mikrofonu dla pola 'Negatywy'.</p>}
          </CardContent>
        </Card>

        <MoodAnalysis currentEntry={dailyEntry} />
      </div>
    </main>
  );
}
