
// src/lib/question-helpers.ts
'use client';

import type { QuestionScore, ThemeScores } from '@/lib/types';
import { themeLabels } from '@/components/theme-assessment'; // Assuming themeLabels is exported from theme-assessment

// Helper to get question text for a given theme
export const getQuestionsForTheme = (themeKey: keyof ThemeScores): string[] => {
  const questions: string[] = [];
  const label = themeLabels[themeKey] || themeKey;

  if (themeKey === 'dreaming') {
    questions.push("O której położyłeś się do łóżka?");
    questions.push("Jak szybko usnąłeś?");
    questions.push("O której się obudziłeś?");
    questions.push("Czy był potrzebny budzik?");
    questions.push("Czy budziłeś się w nocy?");
    questions.push("Czy czułeś się wyspany?");
    questions.push("Jakie miałeś sny?");
    questions.push("Czy uniknąłeś nadmiernych bodźców przed snem?");
  } else if (themeKey === 'moodScore') {
    questions.push("Jak się czujesz fizycznie?");
    questions.push("Jaki masz nastrój?");
    questions.push("Czy czujesz lęk przed nadchodzącym dniem?");
    questions.push("Czy zaplanowałeś dzień?");
    questions.push("Czy zwizualizowałeś swoje życiowe priorytety?");
    questions.push("Czy skupiłeś się na wdzięczności?");
    questions.push("Czy zacząłeś dzień od pozytywnej afirmacji?");
    questions.push("Czy zapisałem jakąś myśl?");
  } else if (themeKey === 'training') {
    questions.push("Ile czasu byłeś na świeżym powietrzu?");
    questions.push("Ile zrobiłeś kroków?");
    questions.push("Ile spaliłeś kalorii?");
    questions.push("Ile czasu poświęciłeś na trening?");
    questions.push("Czy był trening mięśni?");
    questions.push("Czy robiłeś stretching?");
    questions.push("Czy robiłeś ćwiczenia oddechowe?");
    questions.push("Czy chodziłeś po schodach?");
  } else if (themeKey === 'diet') {
    questions.push("Nawodnienie");
    questions.push("Jaka zmiana masy?");
    questions.push("W jakich godzinach jadłeś?");
    questions.push("Co jadłeś na główny posiłek?");
    questions.push("Czy jadłeś słodycze?");
    questions.push("Czy piłeś alkohol?");
    questions.push("Ile razy jadłeś warzywa i owoce?");
    questions.push("Jakie miałeś ciśnienie?");
  } else if (themeKey === 'socialRelations') {
    questions.push("Jak zachowałeś się podczas dojazdów?");
    questions.push("Czy odbyłeś konstruktywną rozmowę szefem?");
    questions.push("Czy miałeś smalltalk z kimś obcym?");
    questions.push("Czy pochwaliłeś współpracownika?");
    questions.push("Czy byłeś aktywny na spotkaniu?");
    questions.push("Czy dogryzałem innym?");
    questions.push("Czy byłem asertywny wobec innych?");
    questions.push("Zainicjowałem kontakt z jakąś osobą?");
  } else if (themeKey === 'familyRelations') {
    questions.push("Czy rozmawiałeś z rodzicami/teściami?");
    questions.push("Czy poświęciłeś uwagę żonie?");
    questions.push("Czy poświęciłeś uwagę synowi?");
    questions.push("Czy pomogłeś w obowiązkach domowych?");
    questions.push("Czy zrobiłeś przyjemność żonie?");
    questions.push("Czy pomogłeś w lekcjach?");
    questions.push("Czy zorganizowałeś wspólne spędzenie czasu?");
    questions.push("Czy zakończyliście dzień w miłej atmosferze?");
  } else if (themeKey === 'selfEducation') {
    questions.push("Czy poświęciłeś czas na czytanie?");
    questions.push("Czy uczyłeś się języka obcego?");
    questions.push("Czy obejrzałeś/wysłuchałeś coś wartościowego?");
    questions.push("Czy uczyłeś się programowania?");
    questions.push("Czy zrobiłeś kurs/quiz on-line?");
    questions.push("Podałeś nowy pomysł na coś?");
    questions.push("Poświęciłeś czas finansom?");
    questions.push("Pracowałeś nad Eunoią?");
  } else {
    for (let i = 0; i < 8; i++) {
      questions.push(`Placeholder Question ${i + 1} for ${label}?`);
    }
  }
  return questions;
};

// Helper to get textual answer label for a given score, theme, and question index
export const getAnswerLabelForScore = (
  themeKey: keyof ThemeScores,
  questionIndex: number,
  score: QuestionScore | undefined
): string => {
  let label = "N/A"; // Default for undefined score or unhandled case

  const isDietQuestion1 = themeKey === 'diet' && questionIndex === 0;
  const isDietQuestion2 = themeKey === 'diet' && questionIndex === 1;
  const isDietQuestion3 = themeKey === 'diet' && questionIndex === 2;
  const isDietQuestion4 = themeKey === 'diet' && questionIndex === 3;
  const isDietQuestion5 = themeKey === 'diet' && questionIndex === 4;
  const isDietQuestion6 = themeKey === 'diet' && questionIndex === 5;
  const isDietQuestion7 = themeKey === 'diet' && questionIndex === 6;
  const isDietQuestion8 = themeKey === 'diet' && questionIndex === 7;
  const isDreamingQuestion1 = themeKey === 'dreaming' && questionIndex === 0;
  const isDreamingQuestion2 = themeKey === 'dreaming' && questionIndex === 1;
  const isDreamingQuestion3 = themeKey === 'dreaming' && questionIndex === 2;
  const isDreamingQuestion4 = themeKey === 'dreaming' && questionIndex === 3;
  const isDreamingQuestion5 = themeKey === 'dreaming' && questionIndex === 4;
  const isDreamingQuestion6 = themeKey === 'dreaming' && questionIndex === 5;
  const isDreamingQuestion7 = themeKey === 'dreaming' && questionIndex === 6;
  const isDreamingQuestion8 = themeKey === 'dreaming' && questionIndex === 7;
  const isMoodQuestion1 = themeKey === 'moodScore' && questionIndex === 0;
  const isMoodQuestion2 = themeKey === 'moodScore' && questionIndex === 1;
  const isMoodQuestion3 = themeKey === 'moodScore' && questionIndex === 2;
  const isMoodQuestion4 = themeKey === 'moodScore' && questionIndex === 3;
  const isMoodQuestion5 = themeKey === 'moodScore' && questionIndex === 4;
  const isMoodQuestion6 = themeKey === 'moodScore' && questionIndex === 5;
  const isMoodQuestion7 = themeKey === 'moodScore' && questionIndex === 6;
  const isMoodQuestion8 = themeKey === 'moodScore' && questionIndex === 7;
  const isTrainingQuestion1 = themeKey === 'training' && questionIndex === 0;
  const isTrainingQuestion2 = themeKey === 'training' && questionIndex === 1;
  const isTrainingQuestion3 = themeKey === 'training' && questionIndex === 2;
  const isTrainingQuestion4 = themeKey === 'training' && questionIndex === 3;
  const isTrainingQuestion5 = themeKey === 'training' && questionIndex === 4;
  const isTrainingQuestion6 = themeKey === 'training' && questionIndex === 5;
  const isTrainingQuestion7 = themeKey === 'training' && questionIndex === 6;
  const isTrainingQuestion8 = themeKey === 'training' && questionIndex === 7;
  const isSocialRelationsQuestion1 = themeKey === 'socialRelations' && questionIndex === 0;
  const isSocialRelationsQuestion2 = themeKey === 'socialRelations' && questionIndex === 1;
  const isSocialRelationsQuestion3 = themeKey === 'socialRelations' && questionIndex === 2;
  const isSocialRelationsQuestion4 = themeKey === 'socialRelations' && questionIndex === 3;
  const isSocialRelationsQuestion5 = themeKey === 'socialRelations' && questionIndex === 4;
  const isSocialRelationsQuestion6 = themeKey === 'socialRelations' && questionIndex === 5;
  const isSocialRelationsQuestion7 = themeKey === 'socialRelations' && questionIndex === 6;
  const isSocialRelationsQuestion8 = themeKey === 'socialRelations' && questionIndex === 7;
  const isFamilyRelationsQuestion1 = themeKey === 'familyRelations' && questionIndex === 0;
  const isFamilyRelationsQuestion2 = themeKey === 'familyRelations' && questionIndex === 1;
  const isFamilyRelationsQuestion3 = themeKey === 'familyRelations' && questionIndex === 2;
  const isFamilyRelationsQuestion4 = themeKey === 'familyRelations' && questionIndex === 3;
  const isFamilyRelationsQuestion5 = themeKey === 'familyRelations' && questionIndex === 4;
  const isFamilyRelationsQuestion6 = themeKey === 'familyRelations' && questionIndex === 5;
  const isFamilyRelationsQuestion7 = themeKey === 'familyRelations' && questionIndex === 6;
  const isFamilyRelationsQuestion8 = themeKey === 'familyRelations' && questionIndex === 7;
  const isSelfEducationQuestion1 = themeKey === 'selfEducation' && questionIndex === 0;
  const isSelfEducationQuestion2 = themeKey === 'selfEducation' && questionIndex === 1;
  const isSelfEducationQuestion3 = themeKey === 'selfEducation' && questionIndex === 2;
  const isSelfEducationQuestion4 = themeKey === 'selfEducation' && questionIndex === 3;
  const isSelfEducationQuestion5 = themeKey === 'selfEducation' && questionIndex === 4;
  const isSelfEducationQuestion6 = themeKey === 'selfEducation' && questionIndex === 5;
  const isSelfEducationQuestion7 = themeKey === 'selfEducation' && questionIndex === 6;
  const isSelfEducationQuestion8 = themeKey === 'selfEducation' && questionIndex === 7;

  if (score === -0.25) {
    if (isDietQuestion1) label = "<1 litr";
    else if (isDietQuestion2) label = "wzrost o ponad 0,3 kg";
    else if (isDietQuestion3) label = "za wcześnie i za późno";
    else if (isDietQuestion4) label = "przetworzone/wieprzowina";
    else if (isDietQuestion5) label = "tak";
    else if (isDietQuestion6) label = "tak";
    else if (isDietQuestion7) label = "wcale";
    else if (isDietQuestion8) label = "90 i więcej";
    else if (isDreamingQuestion1) label = "po g. 23";
    else if (isDreamingQuestion2) label = "Ponad godzinę";
    else if (isDreamingQuestion3) label = "po g. 7";
    else if (isDreamingQuestion4) label = "Musiał dzwonić kilka razy";
    else if (isDreamingQuestion5) label = "tak i miałem problem z ponownym zaśnięciem";
    else if (isDreamingQuestion6) label = "Byłem nieprzytomny";
    else if (isDreamingQuestion7) label = "Koszmary";
    else if (isDreamingQuestion8) label = "Nie";
    else if (isMoodQuestion1) label = "ból/infekcja";
    else if (isMoodQuestion2) label = "przygnębienie/smutek";
    else if (isMoodQuestion3) label = "boję się";
    else if (isMoodQuestion4) label = "brak planu";
    else if (isMoodQuestion5) label = "zapomniałem";
    else if (isMoodQuestion6) label = "nie";
    else if (isMoodQuestion7) label = "nie";
    else if (isMoodQuestion8) label = "nie";
    else if (isTrainingQuestion1) label = "poniżej 30 min.";
    else if (isTrainingQuestion2) label = "mniej niż 4k";
    else if (isTrainingQuestion3) label = "mniej niż 300";
    else if (isTrainingQuestion4) label = "mniej niż 15 min";
    else if (isTrainingQuestion5) label = "nie";
    else if (isTrainingQuestion6) label = "nie";
    else if (isTrainingQuestion7) label = "nie";
    else if (isTrainingQuestion8) label = "nie";
    else if (isSocialRelationsQuestion1) label = "agresywnie";
    else if (isSocialRelationsQuestion2) label = "negatywne emocje";
    else if (isSocialRelationsQuestion3) label = "nie mimo okazji";
    else if (isSocialRelationsQuestion4) label = "nie";
    else if (isSocialRelationsQuestion5) label = "nie mimo okazji";
    else if (isSocialRelationsQuestion6) label = "tak przesadnie";
    else if (isSocialRelationsQuestion7) label = "nie, a było trzeba";
    else if (isSocialRelationsQuestion8) label = "nie mimo przestrzeni";
    else if (isFamilyRelationsQuestion1) label = "nie mimo wolnego czasu";
    else if (isFamilyRelationsQuestion2) label = "nie";
    else if (isFamilyRelationsQuestion3) label = "nie";
    else if (isFamilyRelationsQuestion4) label = "nie";
    else if (isFamilyRelationsQuestion5) label = "nie";
    else if (isFamilyRelationsQuestion6) label = "nie";
    else if (isFamilyRelationsQuestion7) label = "nie mimo okazji";
    else if (isFamilyRelationsQuestion8) label = "awantura";
    else if (isSelfEducationQuestion1) label = "nie";
    else if (isSelfEducationQuestion2) label = "nie";
    else if (isSelfEducationQuestion3) label = "nie";
    else if (isSelfEducationQuestion4) label = "nie";
    else if (isSelfEducationQuestion5) label = "nie";
    else if (isSelfEducationQuestion6) label = "nie";
    else if (isSelfEducationQuestion7) label = "nie";
    else if (isSelfEducationQuestion8) label = "nie";
    else label = "Negative";
  } else if (score === 0) {
    if (isDietQuestion1) label = "1-2 litry";
    else if (isDietQuestion2) label = "bez zmian";
    else if (isDietQuestion3) label = "przekroczony jeden czas";
    else if (isDietQuestion4) label = "drób/wołowina";
    else if (isDietQuestion5) label = "raz i mało";
    else if (isDietQuestion6) label = "lampkę wina";
    else if (isDietQuestion7) label = "2-3 razy";
    else if (isDietQuestion8) label = "85-89";
    else if (isDreamingQuestion1) label = "między g. 22 a 23";
    else if (isDreamingQuestion2) label = "ok. pół godziny";
    else if (isDreamingQuestion3) label = "ok. 6:30";
    else if (isDreamingQuestion4) label = "Wstałem po jednym dzwonku";
    else if (isDreamingQuestion5) label = "tak, na krótko";
    else if (isDreamingQuestion6) label = "Lekko niedospany";
    else if (isDreamingQuestion7) label = "Neutralne / Nie pamiętam";
    else if (isDreamingQuestion8) label = "Częściowo";
    else if (isMoodQuestion1) label = "średnio/zmęczenie";
    else if (isMoodQuestion2) label = "neutralny";
    else if (isMoodQuestion3) label = "mam stres";
    else if (isMoodQuestion4) label = "jest plan ogólny";
    else if (isMoodQuestion5) label = "próbowałem ale rozproszyłem się";
    else if (isMoodQuestion6) label = "na chwilę ale mało konkretnie";
    else if (isMoodQuestion7) label = "tak ale mało przekonująco";
    else if (isMoodQuestion8) label = "tak ale nic istotnego";
    else if (isTrainingQuestion1) label = "ok. 45 min.";
    else if (isTrainingQuestion2) label = "4-6k";
    else if (isTrainingQuestion3) label = "300-500";
    else if (isTrainingQuestion4) label = "15-30 min";
    else if (isTrainingQuestion5) label = "częściowy";
    else if (isTrainingQuestion6) label = "częściowy";
    else if (isTrainingQuestion7) label = "powierzchownie";
    else if (isTrainingQuestion8) label = "do 3 p.";
    else if (isSocialRelationsQuestion1) label = "poprawnie";
    else if (isSocialRelationsQuestion2) label = "neutralnie/brak";
    else if (isSocialRelationsQuestion3) label = "brak okazji";
    else if (isSocialRelationsQuestion4) label = "tak ale słabo";
    else if (isSocialRelationsQuestion5) label = "brak okazji";
    else if (isSocialRelationsQuestion6) label = "raz niewinnie";
    else if (isSocialRelationsQuestion7) label = "nie było potrzeby";
    else if (isSocialRelationsQuestion8) label = "podjąłem próbę";
    else if (isFamilyRelationsQuestion1) label = "tak krótko";
    else if (isFamilyRelationsQuestion2) label = "krótko i pobieżnie";
    else if (isFamilyRelationsQuestion3) label = "krótko i pobieżnie";
    else if (isFamilyRelationsQuestion4) label = "drobne rzeczy";
    else if (isFamilyRelationsQuestion5) label = "drobną";
    else if (isFamilyRelationsQuestion6) label = "nie było potrzeby";
    else if (isFamilyRelationsQuestion7) label = "brak przestrzeni";
    else if (isFamilyRelationsQuestion8) label = "było ok";
    else if (isSelfEducationQuestion1) label = "krótko, bez skupienia";
    else if (isSelfEducationQuestion2) label = "krótko, bez skupienia";
    else if (isSelfEducationQuestion3) label = "fragmentarycznie";
    else if (isSelfEducationQuestion4) label = "fragmentarycznie";
    else if (isSelfEducationQuestion5) label = "tylko quiz";
    else if (isSelfEducationQuestion6) label = "tak ale bez zastosowania";
    else if (isSelfEducationQuestion7) label = "tylko analiza konta";
    else if (isSelfEducationQuestion8) label = "pobieżnie";
    else label = "Neutral";
  } else if (score === 0.25) {
    if (isDietQuestion1) label = ">2 litry";
    else if (isDietQuestion2) label = "spadek o ponad 0,3 kg";
    else if (isDietQuestion3) label = "w godz. 10-20";
    else if (isDietQuestion4) label = "ryba/vege";
    else if (isDietQuestion5) label = "nie";
    else if (isDietQuestion6) label = "nie";
    else if (isDietQuestion7) label = "4 i więcej";
    else if (isDietQuestion8) label = "do 84";
    else if (isDreamingQuestion1) label = "przed g. 22";
    else if (isDreamingQuestion2) label = "ok. kwadrans";
    else if (isDreamingQuestion3) label = "ok. g. 6";
    else if (isDreamingQuestion4) label = "Wstałem przed budzikiem";
    else if (isDreamingQuestion5) label = "nie";
    else if (isDreamingQuestion6) label = "Tak, pełen energii";
    else if (isDreamingQuestion7) label = "Przyjemne";
    else if (isDreamingQuestion8) label = "Tak";
    else if (isMoodQuestion1) label = "znakomicie";
    else if (isMoodQuestion2) label = "entuzjastyczny";
    else if (isMoodQuestion3) label = "brak lęku";
    else if (isMoodQuestion4) label = "plan z checklistą";
    else if (isMoodQuestion5) label = "mam focus na cel";
    else if (isMoodQuestion6) label = "tak dogłębnie";
    else if (isMoodQuestion7) label = "tak i podziałało";
    else if (isMoodQuestion8) label = "tak coś wartościowego";
    else if (isTrainingQuestion1) label = "ponad godzinę";
    else if (isTrainingQuestion2) label = "powyżej 6k";
    else if (isTrainingQuestion3) label = "powyżej 500";
    else if (isTrainingQuestion4) label = "ponad 45 min";
    else if (isTrainingQuestion5) label = "3 partie ciała";
    else if (isTrainingQuestion6) label = "pełny";
    else if (isTrainingQuestion7) label = "gruntownie";
    else if (isTrainingQuestion8) label = "więcej niż 3 p.";
    else if (isSocialRelationsQuestion1) label = "przyjaźnie";
    else if (isSocialRelationsQuestion2) label = "budujące emocje";
    else if (isSocialRelationsQuestion3) label = "zainicjowałem rozmowę";
    else if (isSocialRelationsQuestion4) label = "tak wzmacniająco";
    else if (isSocialRelationsQuestion5) label = "tak wyraziłem swoje zdanie";
    else if (isSocialRelationsQuestion6) label = "nie";
    else if (isSocialRelationsQuestion7) label = "tak";
    else if (isSocialRelationsQuestion8) label = "tak i fajnie wyszło";
    else if (isFamilyRelationsQuestion1) label = "tak z zaangażowaniem";
    else if (isFamilyRelationsQuestion2) label = "tak z uważnością";
    else if (isFamilyRelationsQuestion3) label = "tak z uważnością";
    else if (isFamilyRelationsQuestion4) label = "duży wkład";
    else if (isFamilyRelationsQuestion5) label = "przyłożyłem się";
    else if (isFamilyRelationsQuestion6) label = "tak";
    else if (isFamilyRelationsQuestion7) label = "tak wyszło ok";
    else if (isFamilyRelationsQuestion8) label = "było miło";
    else if (isSelfEducationQuestion1) label = "ponad 30 min uważnie";
    else if (isSelfEducationQuestion2) label = "ponad 30 min";
    else if (isSelfEducationQuestion3) label = "tak do wykorzystania";
    else if (isSelfEducationQuestion4) label = "tak 30 min";
    else if (isSelfEducationQuestion5) label = "tak przydatny";
    else if (isSelfEducationQuestion6) label = "tak do wykorzystania";
    else if (isSelfEducationQuestion7) label = "tak z inwestycjami";
    else if (isSelfEducationQuestion8) label = "gruntownie";
    else label = "Positive";
  }
  return label;
};
