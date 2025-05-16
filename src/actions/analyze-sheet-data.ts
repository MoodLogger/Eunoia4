
'use server';

/**
 * @fileOverview Server action to fetch data from Google Sheets and perform statistical analysis.
 *
 * - analyzeSheetData - Fetches data, calculates stats for the last 30 days.
 * - SheetAnalysisResult - The return type for the analysis function.
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { format, subDays, isValid, parseISO } from 'date-fns';
import type { SheetAnalysisResult, ThemeKey, ParsedSheetEntry } from '@/lib/types';

// Define the order and labels for themes for internal consistency
const THEME_ORDER: ThemeKey[] = [
    'dreaming', 'moodScore', 'training', 'diet',
    'socialRelations', 'familyRelations', 'selfEducation'
];

const THEME_LABELS_PL: Record<ThemeKey, string> = {
    dreaming: 'Sen',
    moodScore: 'Nastawienie',
    training: 'Fitness',
    diet: 'Odżywianie',
    socialRelations: 'Relacje zewnętrzne',
    familyRelations: 'Relacje rodzinne',
    selfEducation: 'Rozwój intelektualny',
};


// Environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Arkusz1';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const RAW_GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
let GOOGLE_PRIVATE_KEY: string | undefined;

if (RAW_GOOGLE_PRIVATE_KEY) {
    try {
        GOOGLE_PRIVATE_KEY = RAW_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    } catch (e) {
        console.error("[AnalyzeSheetData] Error processing GOOGLE_PRIVATE_KEY format:", e);
    }
}

function isPrivateKeyFormatValid(key: string | undefined): boolean {
    return !!key && key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----\n');
}

// Helper to get column index by expected name (case-insensitive partial match for flexibility)
function getColumnIndex(headers: string[], partialName: string): number {
    const lowerPartialName = partialName.toLowerCase();
    return headers.findIndex(header => header.toLowerCase().includes(lowerPartialName));
}

export async function analyzeSheetData(): Promise<SheetAnalysisResult> {
    console.log("[AnalyzeSheetData] Starting analysis...");

    const missingVars: string[] = [];
    if (!SPREADSHEET_ID) missingVars.push("GOOGLE_SHEET_ID");
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!RAW_GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (missing from .env.local)");
    if (!GOOGLE_PRIVATE_KEY && RAW_GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (format error)");

    if (missingVars.length > 0) {
        const errorMsg = `Błąd konfiguracji serwera: Brakujące zmienne środowiskowe: ${missingVars.join(', ')}.`;
        console.error("[AnalyzeSheetData]", errorMsg);
        return { success: false, error: errorMsg };
    }

    if (!isPrivateKeyFormatValid(GOOGLE_PRIVATE_KEY)) {
        const errorMsg = `Nieprawidłowy format GOOGLE_PRIVATE_KEY.`;
        console.error("[AnalyzeSheetData]", errorMsg);
        return { success: false, error: errorMsg };
    }

    let auth;
    try {
        auth = new google.auth.GoogleAuth({
            credentials: { client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: GOOGLE_PRIVATE_KEY! },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        await auth.getClient();
    } catch (authError: any) {
        console.error('[AnalyzeSheetData] Błąd autoryzacji Google:', authError);
        return { success: false, error: `Błąd autoryzacji: ${authError.message}` };
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        console.log(`[AnalyzeSheetData] Reading from sheet: ${SHEET_NAME}, ID: ${SPREADSHEET_ID}`);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID!,
            range: `${SHEET_NAME}`, // Read the whole sheet
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) { // Need at least header + 1 data row
            return { success: false, error: "Brak wystarczających danych w arkuszu do analizy (potrzebny nagłówek i co najmniej jeden wiersz danych)." };
        }

        const headers = rows[0] as string[];
        const dataRows = rows.slice(1);

        // Map headers to indices
        const dateColIdx = getColumnIndex(headers, 'Date');
        const totalScoreColIdx = getColumnIndex(headers, 'Suma Punktów');
        const themeScoreColIndices: Partial<Record<ThemeKey, number>> = {};
        THEME_ORDER.forEach(themeKey => {
            const themeLabel = THEME_LABELS_PL[themeKey];
            const colIdx = getColumnIndex(headers, `${themeLabel} - Wynik Ogólny`);
            if (colIdx !== -1) {
                themeScoreColIndices[themeKey] = colIdx;
            } else {
                console.warn(`[AnalyzeSheetData] Nie znaleziono kolumny dla ${themeLabel} - Wynik Ogólny`);
            }
        });
        
        if (dateColIdx === -1 || totalScoreColIdx === -1) {
            return { success: false, error: "Nie można zlokalizować kolumn 'Date' lub 'Suma Punktów' w arkuszu. Sprawdź nagłówki." };
        }

        const thirtyDaysAgo = subDays(new Date(), 30);
        const parsedEntries: ParsedSheetEntry[] = [];

        for (const row of dataRows) {
            const dateStr = row[dateColIdx];
            const dateObj = parseISO(dateStr); // Assuming YYYY-MM-DD format
            
            if (isValid(dateObj) && dateObj >= thirtyDaysAgo) {
                const totalScore = parseFloat(row[totalScoreColIdx]);
                const currentThemeScores: Partial<Record<ThemeKey, number>> = {};
                THEME_ORDER.forEach(themeKey => {
                    const colIdx = themeScoreColIndices[themeKey];
                    if (colIdx !== undefined && row[colIdx] !== undefined && row[colIdx] !== null) {
                         const scoreVal = parseFloat(String(row[colIdx]).replace(',', '.')); // Handle comma as decimal separator
                        if (!isNaN(scoreVal)) {
                            currentThemeScores[themeKey] = scoreVal;
                        } else {
                             console.warn(`[AnalyzeSheetData] Nieprawidłowa wartość wyniku dla ${themeKey} w dniu ${dateStr}: ${row[colIdx]}`);
                        }
                    }
                });
                if (!isNaN(totalScore)) {
                    parsedEntries.push({ date: dateStr, totalScore, themeScores: currentThemeScores });
                } else {
                     console.warn(`[AnalyzeSheetData] Nieprawidłowa wartość Suma Punktów dla dnia ${dateStr}: ${row[totalScoreColIdx]}`);
                }
            }
        }
        
        // Sort by date ascending
        parsedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        if (parsedEntries.length === 0) {
            return { success: true, message: "Brak danych z ostatnich 30 dni w arkuszu.", processedEntriesCount: 0 };
        }
        
        const processedEntriesCount = parsedEntries.length;
        const startDate = parsedEntries[0].date;
        const endDate = parsedEntries[parsedEntries.length - 1].date;


        // Calculate average scores
        const averageScores: Partial<Record<ThemeKey, number>> = {};
        const sumScores: Partial<Record<ThemeKey, number>> = {};
        const countScores: Partial<Record<ThemeKey, number>> = {};

        THEME_ORDER.forEach(themeKey => {
            sumScores[themeKey] = 0;
            countScores[themeKey] = 0;
        });

        parsedEntries.forEach(entry => {
            THEME_ORDER.forEach(themeKey => {
                if (entry.themeScores[themeKey] !== undefined && !isNaN(entry.themeScores[themeKey]!)) {
                    sumScores[themeKey]! += entry.themeScores[themeKey]!;
                    countScores[themeKey]! += 1;
                }
            });
        });

        THEME_ORDER.forEach(themeKey => {
            if (countScores[themeKey]! > 0) {
                averageScores[themeKey] = parseFloat((sumScores[themeKey]! / countScores[themeKey]!).toFixed(2));
            }
        });

        // Find max score day
        let maxScore = -Infinity;
        let maxScoreDate = '';
        parsedEntries.forEach(entry => {
            if (entry.totalScore > maxScore) {
                maxScore = entry.totalScore;
                maxScoreDate = entry.date;
            }
        });
        const maxScoreDay = { date: maxScoreDate, score: parseFloat(maxScore.toFixed(2)) };

        // Calculate trends (simple comparison of first half vs. second half of the period)
        const trends: Partial<Record<ThemeKey, 'Rosnący' | 'Spadkowy' | 'Stabilny' | 'Za mało danych'>> = {};
        const midPoint = Math.floor(processedEntriesCount / 2);

        if (processedEntriesCount < 4) { // Need at least 2 entries in each half for a meaningful trend
            THEME_ORDER.forEach(themeKey => trends[themeKey] = 'Za mało danych');
        } else {
            THEME_ORDER.forEach(themeKey => {
                let firstHalfSum = 0;
                let firstHalfCount = 0;
                let secondHalfSum = 0;
                let secondHalfCount = 0;

                for (let i = 0; i < midPoint; i++) {
                    if (parsedEntries[i].themeScores[themeKey] !== undefined && !isNaN(parsedEntries[i].themeScores[themeKey]!)) {
                        firstHalfSum += parsedEntries[i].themeScores[themeKey]!;
                        firstHalfCount++;
                    }
                }
                for (let i = midPoint; i < processedEntriesCount; i++) {
                     if (parsedEntries[i].themeScores[themeKey] !== undefined && !isNaN(parsedEntries[i].themeScores[themeKey]!)) {
                        secondHalfSum += parsedEntries[i].themeScores[themeKey]!;
                        secondHalfCount++;
                    }
                }

                if (firstHalfCount > 0 && secondHalfCount > 0) {
                    const avgFirstHalf = firstHalfSum / firstHalfCount;
                    const avgSecondHalf = secondHalfSum / secondHalfCount;
                    
                    if (avgSecondHalf > avgFirstHalf * 1.05) trends[themeKey] = 'Rosnący'; // 5% increase
                    else if (avgSecondHalf < avgFirstHalf * 0.95) trends[themeKey] = 'Spadkowy'; // 5% decrease
                    else trends[themeKey] = 'Stabilny';
                } else {
                    trends[themeKey] = 'Za mało danych';
                }
            });
        }
        
        const period = `Analiza dla okresu: ${startDate} - ${endDate} (${processedEntriesCount} dni).`;
        console.log("[AnalyzeSheetData] Analysis successful:", { averageScores, maxScoreDay, trends, period });
        return { 
            success: true, 
            averageScores, 
            maxScoreDay, 
            trends, 
            processedEntriesCount,
            period,
            startDate,
            endDate,
            message: "Analiza danych z arkusza zakończona sukcesem."
        };

    } catch (error: any) {
        console.error('[AnalyzeSheetData] Błąd podczas analizy danych z arkusza:', error);
        let userFriendlyError = `Nie udało się przeanalizować danych z arkusza.`;
        if (error.response?.data?.error?.message) {
            userFriendlyError += ` Błąd Google API: ${error.response.data.error.message}`;
        } else if (error.message) {
            userFriendlyError += ` Szczegóły: ${error.message}`;
        }
        return { success: false, error: userFriendlyError };
    }
}
