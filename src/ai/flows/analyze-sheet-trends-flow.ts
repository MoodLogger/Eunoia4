
'use server';
/**
 * @fileOverview AI agent for analyzing mood trends from Google Sheet data.
 *
 * - analyzeSheetTrends - A function that processes sheet data to predict mood outlook.
 * - AnalyzeSheetTrendsInput - The input type for the analyzeSheetTrends function.
 * - AnalyzeSheetTrendsOutput - The return type for the analyzeSheetTrends function.
 */

import {ai} from '@/ai/ai-instance'; // Ensure this path is correct
import {z} from 'genkit';

const AnalyzeSheetTrendsInputSchema = z.object({
  sheetDataJson: z
    .string()
    .describe(
      'A stringified JSON array of objects, where each object represents a day\'s full entry from the Google Sheet. This includes date, day of the week, total score, individual theme scores, detailed question scores (numerical), detailed question answers (textual), "Pozytywy" notes, and "Negatywy" notes for the last 30 days.'
    ),
});
export type AnalyzeSheetTrendsInput = z.infer<typeof AnalyzeSheetTrendsInputSchema>;

const AnalyzeSheetTrendsOutputSchema = z.object({
  analysis: z.string().describe('The AI-generated analysis of the mood outlook based on the provided sheet data and prompt.'),
});
export type AnalyzeSheetTrendsOutput = z.infer<typeof AnalyzeSheetTrendsOutputSchema>;

export async function analyzeSheetTrends(input: AnalyzeSheetTrendsInput): Promise<AnalyzeSheetTrendsOutput> {
  return analyzeSheetTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSheetTrendsPrompt',
  input: {schema: AnalyzeSheetTrendsInputSchema},
  output: {schema: AnalyzeSheetTrendsOutputSchema},
  prompt: `Przeanalizuj dostarczone dane z arkusza kalkulacyjnego z ostatnich 30 dni. Dane te zawierają codzienne zapisy dotyczące nastroju, w tym datę, dzień tygodnia, ogólny wynik punktowy, wyniki poszczególnych pryzmatów (Sen, Nastawienie, Fitness, Odżywianie, Relacje zewnętrzne, Relacje rodzinne, Rozwój intelektualny), szczegółowe odpowiedzi (punktowe i tekstowe) na pytania w ramach każdego pryzmatu oraz notatki "Pozytywy" i "Negatywy".

Dane wejściowe (JSON):
{{{sheetDataJson}}}

Na podstawie analizy WSZYSTKICH tych danych liczbowych i tekstowych, odpowiedz na pytanie: Jak zapowiadają się najbliższe dni pod względem nastawienia do życia?
Twoja analiza powinna być w języku polskim. Skup się na identyfikacji wzorców, korelacji i potencjalnych czynników wpływających na nastawienie. Wskaż, które aspekty (pryzmaty, konkretne odpowiedzi, notatki) wydają się mieć największy wpływ. Zakończ prognozą lub sugestiami dotyczącymi utrzymania pozytywnego nastawienia lub poprawy w przypadku negatywnych trendów.
Unikaj tworzenia zbyt długich odpowiedzi, skup się na zwięzłych i konkretnych wnioskach.
`,
});

const analyzeSheetTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeSheetTrendsFlow',
    inputSchema: AnalyzeSheetTrendsInputSchema,
    outputSchema: AnalyzeSheetTrendsOutputSchema,
  },
  async (input: AnalyzeSheetTrendsInput) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI analysis for sheet trends did not return a valid output.");
    }
    return output;
  }
);
