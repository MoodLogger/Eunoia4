
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Lightbulb, UploadCloud, AlertCircle, CheckCircle, BarChart3, TrendingUp, TrendingDown, CalendarDays, Trophy } from 'lucide-react';
// Removed: import { analyzeMoodPatterns } from '@/ai/flows/analyze-mood-patterns';
import { analyzeSheetData } from '@/actions/analyze-sheet-data'; // New import
import { exportToGoogleSheets, testReadGoogleSheet } from '@/actions/export-to-google-sheets';
import type { DailyEntry, StoredData, ThemeScores, QuestionScore, SheetAnalysisResult, ThemeKey } from '@/lib/types'; // Added SheetAnalysisResult
// Removed: import { getAllEntries } from '@/lib/storage'; - No longer fetching all entries for AI
import { useToast } from '@/hooks/use-toast';
import { themeOrder, themeLabels } from '@/components/theme-assessment';
import { getQuestionsForTheme, getAnswerLabelForScore } from '@/lib/question-helpers'; 

interface MoodAnalysisProps {
  currentEntry: DailyEntry | null;
}

// Removed prepareDataForAnalysis function for Genkit AI flow

const generateSheetHeaders = (): string[] => {
    const headers: string[] = ['Date', 'Suma Punktów'];
    themeOrder.forEach(themeKey => {
        headers.push(`${themeLabels[themeKey]} - Wynik Ogólny`);
        const questions = getQuestionsForTheme(themeKey);
        questions.forEach((questionText, qIndex) => {
            const sanitizedQuestionText = questionText.substring(0, 100);
            headers.push(`${themeLabels[themeKey]} - ${sanitizedQuestionText} - Wynik`);
            headers.push(`${themeLabels[themeKey]} - ${sanitizedQuestionText} - Odpowiedź`);
        });
    });
    return headers;
};

const SHEET_HEADERS = generateSheetHeaders();

function prepareDataForSheetExport(entry: DailyEntry | null): (string | number | null)[][] {
    if (!entry || !entry.scores || !entry.detailedScores) return [];
    
    const rowData: (string | number | null)[] = [entry.date];
    
    let totalSum = 0;
    themeOrder.forEach(themeKey => {
        totalSum += entry.scores?.[themeKey] ?? 0;
    });
    rowData.push(parseFloat(totalSum.toFixed(2)));

    themeOrder.forEach(themeKey => {
        rowData.push(entry.scores?.[themeKey] ?? 0); 
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
    return [rowData];
}


export function MoodAnalysis({ currentEntry }: MoodAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<SheetAnalysisResult | null>(null); // Changed type
  const [exportMessage, setExportMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const [isTestingSheetRead, setIsTestingSheetRead] = React.useState(false);


  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Removed fetchDataForAllEntries as it's not used by the new analysis logic

  const handleAnalyzeMoods = async () => {
    if (!isClient) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setExportMessage(null);

    try {
      // const allEntries = await fetchDataForAllEntries(); // No longer needed for AI
      // const entriesCount = Object.keys(allEntries).length; // No longer needed for AI

      // if (entriesCount < 3) { // This check might be irrelevant or need to be based on Sheet data count
      //     setError("Za mało danych do analizy. Proszę logować swoje oceny przez co najmniej 3 dni.");
      //     setIsAnalyzing(false);
      //     return;
      // }
      // const { moodData, themeScores } = prepareDataForAnalysis(allEntries); // No longer needed for AI
      // const result = await analyzeMoodPatterns({ moodData, themeScores }); // Old AI call
      
      toast({ title: "Rozpoczynam analizę danych z Arkusza Google...", description: "To może chwilę potrwać." });
      const result = await analyzeSheetData(); // New call to sheet analysis
      
      if (result.success) {
        setAnalysisResult(result);
        if(result.message) {
            toast({ title: "Analiza zakończona", description: result.message });
        }
      } else {
        throw new Error(result.error || "Analiza danych z arkusza nie powiodła się.");
      }

    } catch (err) {
      console.error("Error analyzing sheet data:", err);
      const errorMessage = err instanceof Error ? err.message : "Analiza nie powiodła się.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Analiza nie powiodła się", description: errorMessage });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportData = async () => {
      if (!isClient) return;
      
      setIsExporting(true);
      setError(null);
      // setAnalysisResult(null); // Keep analysis result visible during export
      setExportMessage(null);

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

  const handleTestSheetRead = async () => {
    if (!isClient) return;
    setIsTestingSheetRead(true);
    setError(null);
    // setAnalysisResult(null);
    setExportMessage(null);
    toast({ title: "Testowanie odczytu", description: "Próba odczytu z Google Sheet..." });
    try {
        const result = await testReadGoogleSheet(); 
        if (result.success) {
            const successMsg = `Test odczytu udany. Odczytano dane: ${JSON.stringify(result.data || "brak danych w zakresie")}.`;
            setExportMessage(successMsg);
            toast({ title: "Test odczytu udany", description: successMsg, duration: 10000 });
        } else {
            throw new Error(result.error || "Nieznany błąd podczas testu odczytu.");
        }
    } catch (err) {
        console.error("Error testing sheet read:", err);
        const errorMessage = err instanceof Error ? err.message : "Test odczytu nie powiódł się.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Test odczytu nie powiódł się", description: errorMessage, duration: 10000 });
    } finally {
        setIsTestingSheetRead(false);
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
            <Button onClick={handleAnalyzeMoods} disabled={isAnalyzing || isExporting || isTestingSheetRead}>
              {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizuję...</> : <><BarChart3 className="mr-2 h-4 w-4" /> Analizuj</>}
            </Button>
             <Button onClick={handleExportData} disabled={isAnalyzing || isExporting || isTestingSheetRead || !currentEntry} variant="outline">
              {isExporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportuję...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Export do Arkuszy</>}
            </Button>
        </div>
         <div className="flex justify-center pt-2">
            <Button onClick={handleTestSheetRead} disabled={isAnalyzing || isExporting || isTestingSheetRead} variant="secondary" size="sm">
                {isTestingSheetRead ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testuję...</> : "Testuj Odczyt Arkusza"}
            </Button>
        </div>

        {error && !isAnalyzing && !isExporting && !isTestingSheetRead && (
            <Alert variant="destructive" className="mt-4">
                 <AlertCircle className="h-4 w-4" />
                <AlertTitle>Wystąpił błąd</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {analysisResult && analysisResult.success && !isAnalyzing && (
          <Alert variant="default" className="mt-4 bg-accent/10 border-accent text-sm">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent-foreground font-semibold mb-2">Statystyki z Arkusza Google</AlertTitle>
            <AlertDescription className="text-accent-foreground/90 space-y-2">
              {analysisResult.period && <p className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> {analysisResult.period}</p>}
              
              {analysisResult.averageScores && Object.keys(analysisResult.averageScores).length > 0 && (
                <div>
                  <h4 className="font-medium mt-2 mb-1">Średnie wyniki pryzmatów:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {themeOrder.map(themeKey => (
                       analysisResult.averageScores![themeKey] !== undefined && (
                        <li key={themeKey}>
                          {themeLabels[themeKey]}: <span className="font-semibold">{analysisResult.averageScores![themeKey]?.toFixed(2)}</span>
                        </li>
                       )
                    ))}
                  </ul>
                </div>
              )}

              {analysisResult.maxScoreDay && (
                <p className="flex items-center mt-2"><Trophy className="mr-2 h-4 w-4 text-yellow-500" /> Najlepszy dzień: {analysisResult.maxScoreDay.date} (Suma: <span className="font-semibold">{analysisResult.maxScoreDay.score}</span>)</p>
              )}

              {analysisResult.trends && Object.keys(analysisResult.trends).length > 0 && (
                <div>
                  <h4 className="font-medium mt-3 mb-1">Trendy pryzmatów:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {themeOrder.map(themeKey => {
                       const trend = analysisResult.trends![themeKey];
                       if (trend) {
                         return (
                            <li key={themeKey} className="flex items-center">
                              {themeLabels[themeKey]}: <span className="font-semibold ml-1 mr-1">{trend}</span>
                              {trend === 'Rosnący' && <TrendingUp className="h-4 w-4 text-green-500" />}
                              {trend === 'Spadkowy' && <TrendingDown className="h-4 w-4 text-red-500" />}
                            </li>
                         );
                       }
                       return null;
                    })}
                  </ul>
                </div>
              )}
              {analysisResult.processedEntriesCount === 0 && <p>Brak danych w arkuszu dla wybranego okresu.</p>}
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
