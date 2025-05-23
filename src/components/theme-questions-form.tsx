
"use client";

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ThemeQuestionScores, QuestionScore, ThemeScores } from '@/lib/types';
import { Input } from '@/components/ui/input'; 
import { getQuestionsForTheme, getAnswerLabelForScore } from '@/lib/question-helpers'; // Import helpers

interface ThemeQuestionsFormProps {
  themeKey: keyof ThemeScores;
  themeLabel: string;
  detailedScores: ThemeQuestionScores;
  onQuestionScoreChange: (themeKey: keyof ThemeScores, questionIndex: number, value: QuestionScore) => void;
}

// themeLabelMap is no longer needed here as themeLabel prop is used directly
// and full question text is generated by getQuestionsForTheme

export function ThemeQuestionsForm({
  themeKey,
  themeLabel, 
  detailedScores,
  onQuestionScoreChange
}: ThemeQuestionsFormProps) {

   const isEditableThemeQ8 = false; 
   const [customQuestion8Text, setCustomQuestion8Text] = React.useState(''); 
   const [isClient, setIsClient] = React.useState(false);

   React.useEffect(() => {
     setIsClient(true);
     setCustomQuestion8Text('');
   }, [themeKey]);


   const questions = getQuestionsForTheme(themeKey);


  const handleValueChange = (questionIndex: number, value: string) => {
    const score = parseFloat(value) as QuestionScore;
    if ([-0.25, 0, 0.25].includes(score)) {
      onQuestionScoreChange(themeKey, questionIndex, score);
    }
  };

   const handleCustomQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     setCustomQuestion8Text(event.target.value);
   };

   if (!isClient) {
    return <div>Ładowanie pytań...</div>; 
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center text-primary">
        {
          themeKey === 'dreaming' ? 'Pytania na temat snu' :
          themeKey === 'moodScore' ? 'Pytania na temat nastawienia' :
          `Pytania: ${themeLabel}`
        }
      </h3>
      {questions.map((question, index) => {
        const isEditableQuestion8 = index === 7 && isEditableThemeQ8; 
        
        const currentScore = detailedScores?.[index];
        const negativeLabel = getAnswerLabelForScore(themeKey, index, -0.25);
        const neutralLabel = getAnswerLabelForScore(themeKey, index, 0);
        const positiveLabel = getAnswerLabelForScore(themeKey, index, 0.25);

        return (
          <div key={`${themeKey}-${index}`} className="space-y-3 p-4 border rounded-md bg-card shadow-sm">
             {isEditableQuestion8 ? (
               <Input
                 type="text"
                 id={`${themeKey}-q${index}-text`}
                 value={customQuestion8Text}
                 onChange={handleCustomQuestionChange}
                 placeholder="Enter your custom question 8"
                 className="text-sm font-medium text-foreground/90 block mb-2 border-dashed"
               />
             ) : (
               <Label htmlFor={`${themeKey}-q${index}-radiogroup`} className="text-sm font-medium text-foreground/90 block mb-2">
                 {index + 1}. {question}
               </Label>
             )}
            <RadioGroup
              id={`${themeKey}-q${index}-radiogroup`} 
              value={(currentScore?.toString()) ?? '0'}
              onValueChange={(value) => handleValueChange(index, value)}
              className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:justify-between" 
            >
              <div className="flex items-center space-x-1"> 
                <RadioGroupItem value="-0.25" id={`${themeKey}-q${index}-neg`} aria-label={negativeLabel}/>
                <Label htmlFor={`${themeKey}-q${index}-neg`} className="text-xs text-muted-foreground">
                  {negativeLabel} {`(-0.25)`}
                </Label>
              </div>
              <div className="flex items-center space-x-1"> 
                <RadioGroupItem value="0" id={`${themeKey}-q${index}-neu`} aria-label={neutralLabel}/>
                <Label htmlFor={`${themeKey}-q${index}-neu`} className="text-xs text-muted-foreground">
                   {neutralLabel} {`(0)`}
                </Label>
              </div>
              <div className="flex items-center space-x-1"> 
                <RadioGroupItem value="0.25" id={`${themeKey}-q${index}-pos`} aria-label={positiveLabel}/>
                <Label htmlFor={`${themeKey}-q${index}-pos`} className="text-xs text-muted-foreground">
                  {positiveLabel} {`(+0.25)`}
                </Label>
              </div>
            </RadioGroup>
          </div>
        );
      })}
    </div>
  );
}
