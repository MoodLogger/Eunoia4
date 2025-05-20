
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, UploadCloud, AlertCircle, CheckCircle, BarChart3, Edit3, Mic, MicOff } from 'lucide-react';
import { analyzeSheetData } from '@/actions/analyze-sheet-data';
import { exportToGoogleSheets } from '@/actions/export-to-google-sheets';
import type { DailyEntry, AISheetAnalysisResult, QuestionScore } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { themeOrder, themeLabels } from '@/components/theme-assessment';
import { getQuestionsForTheme, getAnswerLabelForScore } from '@/lib/question-helpers';
import { format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';

interface MoodAnalysisProps {
  currentEntry: DailyEntry | null;
}

const generateSheetHeaders = (): string[] => {
    const headers: string[] = ['Date', 'Dzień Tygodnia', 'Suma Punktów'];

    themeOrder.forEach(themeKey => {
        headers.push(`${themeLabels[themeKey]} - Wynik Ogólny`);
    });

    themeOrder.forEach(themeKey => {
        const questions = getQuestionsForTheme(themeKey);
        questions.forEach((questionText, qIndex) => {
            const sanitizedQuestionText = questionText.substring(0, 100); 
            headers.push(`${themeLabels[themeKey]} - ${sanitizedQuestionText} - Wynik`);
            headers.push(`${themeLabels[themeKey]} - ${sanitizedQuestionText} - Odpowiedź`);
        });
    });
    headers.push('Pozytywy');
    headers.push('Negatywy');
    return headers;
};

const SHEET_HEADERS = generateSheetHeaders();

function prepareDataForSheetExport(entry: DailyEntry | null): (string | number | null)[][] {
    if (!entry || !entry.scores || !entry.detailedScores) return [];

    const dateObj = parseISO(entry.date);
    const dayOfWeek = format(dateObj, 'EEEE', { locale: pl });

    const rowData: (string | number | null)[] = [entry.date, dayOfWeek];

    let totalSum = 0;
    themeOrder.forEach(themeKey => {
        totalSum += entry.scores?.[themeKey] ?? 0;
    });
    rowData.push(parseFloat(totalSum.toFixed(2)));

    themeOrder.forEach(themeKey => {
        rowData.push(entry.scores?.[themeKey] ?? 0);
    });

    themeOrder.forEach(themeKey => {
        const questionsCount = getQuestionsForTheme(themeKey).length;
        for (let qIndex = 0; qIndex < questionsCount; qIndex++) {
            const questionScoreValue = entry.detailedScores[themeKey]?.[qIndex];
            const questionScore: QuestionScore | undefined =
                (questionScoreValue === -0.25 || questionScoreValue === 0 || questionScoreValue === 0.25)
                ? questionScoreValue
                : undefined;

            rowData.push(questionScore ?? 0);
            rowData.push(getAnswerLabelForScore(themeKey, qIndex, questionScore));
        }
    });

    rowData.push(entry.positives || '');
    rowData.push(entry.negatives || '');

    return [rowData];
}


export function MoodAnalysis({ currentEntry }: MoodAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AISheetAnalysisResult | null>(null);
  const [exportMessage, setExportMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const [customPrompt, setCustomPrompt] = React.useState<string>('');
  const aiPromptSpeech = useSpeechRecognition();


  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!aiPromptSpeech.isListening && aiPromptSpeech.transcript) {
        setCustomPrompt(prev => (prev ? prev + ' ' : '') + aiPromptSpeech.transcript.trim());
        aiPromptSpeech.clearTranscript();
    }
  }, [aiPromptSpeech.isListening, aiPromptSpeech.transcript, aiPromptSpeech.clearTranscript]);
  
  React.useEffect(() => {
    if (aiPromptSpeech.error) {
        toast({ variant: "destructive", title: "Błąd nagrywania (Zapytaj AI)", description: aiPromptSpeech.error });
    }
  }, [aiPromptSpeech.error, toast]);

  const handleAnalyzeData = async (promptToUse?: string) => {
    if (!isClient) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setExportMessage(null); // Clear previous export messages when starting analysis

    try {
      toast({ title: "Rozpoczynam analizę danych z Arkusza Google przez AI...", description: "To może chwilę potrwać." });
      const result = await analyzeSheetData(promptToUse);

      if (result.success) {
        setAnalysisResult(result);
        if(result.message) {
            toast({ title: "Analiza AI zakończona", description: result.message });
        } else {
            toast({ title: "Analiza AI zakończona", description: "Wyniki dostępne poniżej." });
        }
      } else {
        throw new Error(result.error || "Analiza danych z arkusza przez AI nie powiodła się.");
      }

    } catch (err) {
      console.error("Error analyzing sheet data with AI:", err);
      const errorMessage = err instanceof Error ? err.message : "Analiza AI nie powiodła się.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Analiza AI nie powiodła się", description: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportData = async () => {
      if (!isClient) return;

      setIsExporting(true);
      setError(null);
      setExportMessage(null);
      setAnalysisResult(null); // Clear previous analysis results when starting export


      if (!currentEntry) {
        const noDataMsg = "Brak danych dla wybranego dnia do wyeksportowania.";
        setError(noDataMsg);
        toast({ variant: "destructive", title: "Export nie powiódł się", description: noDataMsg });
        setIsExporting(false);
        return;
      }

      try {
          const dataRows = prepareDataForSheetExport(currentEntry);

          if (dataRows.length === 0) {
              const noDataMsg = "Brak danych do wyeksportowania dla wybranego dnia.";
              setError(noDataMsg);
              toast({ variant: "destructive", title: "Export nie powiódł się", description: noDataMsg });
              setIsExporting(false);
              return;
          }
          console.log("[MoodAnalysis] Exporting with headers:", SHEET_HEADERS);
          console.log("[MoodAnalysis] Exporting data row:", dataRows[0]);
          const result = await exportToGoogleSheets({ headers: SHEET_HEADERS, data: dataRows });
          if (result.success) {
              const successMsg = result.message || `Dane wyeksportowane. ${result.rowsAppended || 0} wierszy dodanych, ${result.rowsUpdated || 0} wierszy zaktualizowanych.`;
              setExportMessage(successMsg);
              toast({ title: "Export udany", description: successMsg });
          } else {
              throw new Error(result.error || "Nieznany błąd podczas exportu.");
          }
      } catch (err) {
          console.error("Error exporting data:", err);
          const errorMessage = err instanceof Error ? err.message : "Export nie powiódł się.";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Export nie powiódł się", description: errorMessage });
      } finally {
          setIsExporting(false);
      }
  };


  if (!isClient) {
    return (
        <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="text-center flex items-center justify-center"><BarChart3 className="mr-2 h-5 w-5 text-accent" /> Analiza i export</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4 p-6">
                 <div className="animate-pulse h-10 bg-muted rounded w-3/4"></div>
                 <div className="animate-pulse h-10 bg-muted rounded w-3/4"></div>
                 <div className="animate-pulse h-8 bg-muted rounded w-1/2 mt-2"></div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center"><BarChart3 className="mr-2 h-5 w-5 text-accent" /> Analiza i export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={() => handleAnalyzeData()} disabled={isAnalyzing || isExporting}>
              {isAnalyzing && !customPrompt ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizuję...</> : <><Lightbulb className="mr-2 h-4 w-4" /> Analizuj</>}
            </Button>
             <Button onClick={handleExportData} disabled={isAnalyzing || isExporting || !currentEntry} variant="outline">
              {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportuję...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Export do Arkuszy</>}
            </Button>
        </div>
        <div className="space-y-2 pt-4">
            <div className="relative">
                <Label htmlFor="custom-prompt" className="flex items-center mb-1">Zapytaj AI:</Label>
                <Textarea
                    id="custom-prompt"
                    placeholder="Np. 'Który pryzmat miał największy negatywny wpływ w ostatnim tygodniu?'"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px] pr-10"
                    disabled={isAnalyzing || isExporting}
                />
                {aiPromptSpeech.hasRecognitionSupport && (
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute bottom-2 right-1 h-8 w-8"
                        onClick={aiPromptSpeech.isListening ? aiPromptSpeech.stopListening : aiPromptSpeech.startListening}
                        title={aiPromptSpeech.isListening ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie (Zapytaj AI)"}
                        disabled={isAnalyzing || isExporting || aiPromptSpeech.permissionStatus === 'denied'}
                    >
                        {aiPromptSpeech.isListening ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                    </Button>
                )}
            </div>
             {aiPromptSpeech.interimTranscript && aiPromptSpeech.isListening && (
                <p className="text-xs text-muted-foreground">Słucham (AI): <em>{aiPromptSpeech.interimTranscript}</em></p>
            )}
            {aiPromptSpeech.permissionStatus === 'denied' && <p className="text-xs text-red-500 mt-1">Odmówiono dostępu do mikrofonu dla pola 'Zapytaj AI'.</p>}
            {!aiPromptSpeech.hasRecognitionSupport && customPrompt === '' && <p className="text-xs text-muted-foreground mt-1">Rozpoznawanie mowy nie jest wspierane.</p>}


            <Button onClick={() => handleAnalyzeData(customPrompt)} disabled={isAnalyzing || isExporting || !customPrompt.trim()} className="w-full sm:w-auto mt-2">
              {isAnalyzing && customPrompt ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizuję...</> : <><Edit3 className="mr-2 h-4 w-4" /> Odpowiedź AI</>}
            </Button>
        </div>

        {error && !isAnalyzing && !isExporting && (
            <Alert variant="destructive" className="mt-4">
                 <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wystąpił błąd</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {analysisResult && analysisResult.success && analysisResult.analysis && !isAnalyzing && (
          <Alert variant="default" className="mt-4 bg-accent/10 border-accent text-sm">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent-foreground font-semibold mb-2">Analiza AI Nastawienia</AlertTitle>
            <AlertDescription className="text-accent-foreground/90 space-y-2 whitespace-pre-wrap">
              {analysisResult.analysis}
            </AlertDescription>
          </Alert>
        )}
         {analysisResult && analysisResult.success && !analysisResult.analysis && !isAnalyzing && (
             <Alert variant="default" className="mt-4 bg-primary/10 border-primary">
                <CheckCircle className="h-4 w-4 text-primary"/>
                <AlertTitle className="text-primary-foreground">Analiza Zakończona</AlertTitle>
                <AlertDescription className="text-primary-foreground/90">
                    {analysisResult.message || "Analiza AI zakończona, ale nie zwróciła tekstu."}
                </AlertDescription>
            </Alert>
         )}


        {exportMessage && !error && !isExporting && (
            <Alert variant="default" className="mt-4 bg-primary/10 border-primary">
                <CheckCircle className="h-4 w-4 text-primary"/>
                <AlertTitle className="text-primary-foreground">Status Exportu</AlertTitle>
                <AlertDescription className="text-primary-foreground/90">
                    {exportMessage}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
