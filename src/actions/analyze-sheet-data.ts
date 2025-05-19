
'use server';

/**
 * @fileOverview Server action to fetch data from Google Sheets and perform AI-powered analysis.
 *
 * - analyzeSheetData - Fetches data, sends it to Genkit flow for analysis.
 * - AISheetAnalysisResult - The return type for the analysis function.
 */

import { google } from 'googleapis';
import { z } from 'zod';
import { subDays, isValid, parseISO, format } from 'date-fns';
import type { AISheetAnalysisResult, ParsedSheetEntry, ThemeKey, QuestionScore } from '@/lib/types';
import { analyzeSheetTrends } from '@/ai/flows/analyze-sheet-trends-flow';
import { themeOrder, themeLabels } from '@/components/theme-assessment'; // Assuming these are still relevant for header mapping
import { getQuestionsForTheme, getAnswerLabelForScore } from '@/lib/question-helpers';


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
        console.error("[AnalyzeSheetDataWithAI] Error processing GOOGLE_PRIVATE_KEY format:", e);
    }
}

function isPrivateKeyFormatValid(key: string | undefined): boolean {
    return !!key && key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----\n');
}

// Helper to get column index by expected name (case-insensitive partial match for flexibility)
// This needs to be robust enough to find all the new detailed columns.
function getColumnIndex(headers: string[], partialName: string, exactMatch: boolean = false): number {
    const lowerPartialName = partialName.toLowerCase().trim();
    return headers.findIndex(header => {
        const lowerHeader = header.toLowerCase().trim();
        return exactMatch ? lowerHeader === lowerPartialName : lowerHeader.includes(lowerPartialName);
    });
}


export async function analyzeSheetData(): Promise<AISheetAnalysisResult> {
    console.log("[AnalyzeSheetDataWithAI] Starting AI analysis...");

    const missingVars: string[] = [];
    if (!SPREADSHEET_ID) missingVars.push("GOOGLE_SHEET_ID");
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!RAW_GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (missing)");
    if (!GOOGLE_PRIVATE_KEY && RAW_GOOGLE_PRIVATE_KEY) missingVars.push("GOOGLE_PRIVATE_KEY (format error)");

    if (missingVars.length > 0) {
        const errorMsg = `Błąd konfiguracji serwera: Brakujące zmienne środowiskowe: ${missingVars.join(', ')}.`;
        console.error("[AnalyzeSheetDataWithAI]", errorMsg);
        return { success: false, error: errorMsg };
    }

    if (!isPrivateKeyFormatValid(GOOGLE_PRIVATE_KEY)) {
        const errorMsg = `Nieprawidłowy format GOOGLE_PRIVATE_KEY.`;
        console.error("[AnalyzeSheetDataWithAI]", errorMsg);
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
        console.error('[AnalyzeSheetDataWithAI] Błąd autoryzacji Google:', authError);
        return { success: false, error: `Błąd autoryzacji: ${authError.message}` };
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        console.log(`[AnalyzeSheetDataWithAI] Reading from sheet: ${SHEET_NAME}, ID: ${SPREADSHEET_ID}`);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID!,
            range: `${SHEET_NAME}`, // Read the whole sheet
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return { success: false, error: "Brak wystarczających danych w arkuszu do analizy (potrzebny nagłówek i co najmniej jeden wiersz danych)." };
        }

        const headers = rows[0] as string[];
        const dataRows = rows.slice(1);
        const thirtyDaysAgo = subDays(new Date(), 30);
        const sheetEntriesForAI: Record<string, any>[] = [];

        // Map headers to indices more dynamically
        const headerMap: Record<string, number> = {};
        headers.forEach((h, i) => headerMap[h.trim().toLowerCase()] = i);
        
        console.log("[AnalyzeSheetDataWithAI] Sheet Headers Found:", headers);
        console.log("[AnalyzeSheetDataWithAI] Mapped Headers:", headerMap);


        for (const row of dataRows) {
            const dateColIdx = headerMap['date'];
            if (dateColIdx === undefined) {
                 console.error("[AnalyzeSheetDataWithAI] Critical: 'Date' column not found in sheet headers using map:", headers);
                 return { success: false, error: "Nie można zlokalizować kolumny 'Date'. Sprawdź nagłówki." };
            }
            const dateStr = row[dateColIdx];
            // Robust date parsing
            let dateObj: Date | null = null;
            if (typeof dateStr === 'string') {
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
                    dateObj = parseISO(dateStr.trim());
                }
            } else if (typeof dateStr === 'number') { // Excel/Sheets date serial number
                const excelEpochDiff = 25569; 
                const dateInMs = (dateStr - excelEpochDiff) * 24 * 60 * 60 * 1000;
                dateObj = new Date(dateInMs);
            }
            if (!dateObj || !isValid(dateObj)) {
                console.warn(`[AnalyzeSheetDataWithAI] Skipping row due to invalid date: ${dateStr}`);
                continue;
            }
            
            if (dateObj >= thirtyDaysAgo) {
                const entry: Record<string, any> = { date: format(dateObj, 'yyyy-MM-dd') };
                
                // Iterate over mapped headers to extract data
                for (const headerName in headerMap) {
                    const colIdx = headerMap[headerName];
                    const originalHeaderKey = headers[colIdx]; // Keep original case for the key in JSON
                    let value = row[colIdx];
                    
                    // Try to parse numbers for score columns
                    if (typeof value === 'string' && headerName.includes('wynik')) {
                        const parsedValue = parseFloat(value.replace(',', '.'));
                        if (!isNaN(parsedValue)) {
                            value = parsedValue;
                        }
                    }
                    entry[originalHeaderKey] = value !== undefined ? value : null;
                }
                sheetEntriesForAI.push(entry);
            }
        }
        
        sheetEntriesForAI.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());


        if (sheetEntriesForAI.length === 0) {
            return { success: true, analysis: "Brak danych z ostatnich 30 dni w arkuszu do analizy.", message: "Brak danych z ostatnich 30 dni." };
        }
        
        console.log(`[AnalyzeSheetDataWithAI] Prepared ${sheetEntriesForAI.length} entries for AI analysis.`);

        const sheetDataJson = JSON.stringify(sheetEntriesForAI);
        
        // Call the Genkit flow
        const aiResult = await analyzeSheetTrends({ sheetDataJson });

        return { 
            success: true, 
            analysis: aiResult.analysis,
            message: `Analiza AI zakończona. Przeanalizowano ${sheetEntriesForAI.length} wpisów.`
        };

    } catch (error: any) {
        console.error('[AnalyzeSheetDataWithAI] Błąd podczas analizy danych z arkusza przez AI:', error);
        let userFriendlyError = `Nie udało się przeanalizować danych z arkusza za pomocą AI.`;
        if (error.response?.data?.error?.message) {
            userFriendlyError += ` Błąd Google API: ${error.response.data.error.message}`;
        } else if (error.message) {
            userFriendlyError += ` Szczegóły: ${error.message}`;
        }
        return { success: false, error: userFriendlyError };
    }
}
