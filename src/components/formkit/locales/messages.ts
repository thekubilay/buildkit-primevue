export type Locale = "ja" | "en";

export interface LocaleMessages {
  required: string;
  invalidType: (expected: string) => string;
  invalidUnion: string;
  invalidLiteral: string;
  invalidEnum: string;
  fallback: string;
  typeLabels: {
    string: string;
    number: string;
    boolean: string;
    array: string;
    date: string;
    object: string;
  };
  email: string;
  min: (n: number) => string;
  max: (n: number) => string;
  length: (n: number) => string;
  betweenMin: (n: number) => string;
  betweenMax: (n: number) => string;
  katakana: string;
  hiragana: string;
  numberOnly: string;
  romaji: string;
  nospace: string;
  url: string;
  regex: string;
  selectRequired: string;
  selectInvalid: string;
  numberInput: string;
  dateInput: string;
  arrayMin: (n: number) => string;
  arrayMax: (n: number) => string;
}

export const messages: Record<Locale, LocaleMessages> = {
  ja: {
    required: "必須項目です",
    invalidType: (expected: string) => `無効な入力です（${expected}が必要です）`,
    invalidUnion: "選択された値が無効です",
    invalidLiteral: "有効な選択肢を選んでください",
    invalidEnum: "有効な選択肢を選んでください",
    fallback: "入力値が無効です",
    typeLabels: {
      string: "文字列",
      number: "数値",
      boolean: "真偽値",
      array: "配列",
      date: "日付",
      object: "オブジェクト",
    },
    email: "有効なメールアドレスを入力してください",
    min: (n: number) => `最低${n}文字で入力してください`,
    max: (n: number) => `最大${n}文字で入力してください`,
    length: (n: number) => `${n}文字で入力してください`,
    betweenMin: (n: number) => `${n}文字以上で入力してください`,
    betweenMax: (n: number) => `${n}文字以下で入力してください`,
    katakana: "カタカナと空白のみで入力してください",
    hiragana: "ひらがなと空白のみで入力してください",
    numberOnly: "数字のみで入力してください",
    romaji: "ローマ字、数字、アンダースコア、ハイフンのみで入力してください",
    nospace: "空白を含まないでください",
    url: "有効なURLを入力してください",
    regex: "入力形式が正しくありません",
    selectRequired: "必須項目です",
    selectInvalid: "有効な選択肢を選んでください",
    numberInput: "数値を入力してください",
    dateInput: "日付を選択してください",
    arrayMin: (n: number) => `最低${n}項目を選択してください`,
    arrayMax: (n: number) => `最大${n}項目まで選択できます`,
  },
  en: {
    required: "This field is required",
    invalidType: (expected: string) => `Invalid input (${expected} expected)`,
    invalidUnion: "The selected value is invalid",
    invalidLiteral: "Please select a valid option",
    invalidEnum: "Please select a valid option",
    fallback: "Invalid input",
    typeLabels: {
      string: "string",
      number: "number",
      boolean: "boolean",
      array: "array",
      date: "date",
      object: "object",
    },
    email: "Please enter a valid email address",
    min: (n: number) => `Must be at least ${n} characters`,
    max: (n: number) => `Must be at most ${n} characters`,
    length: (n: number) => `Must be exactly ${n} characters`,
    betweenMin: (n: number) => `Must be at least ${n} characters`,
    betweenMax: (n: number) => `Must be at most ${n} characters`,
    katakana: "Only katakana and spaces are allowed",
    hiragana: "Only hiragana and spaces are allowed",
    numberOnly: "Only numbers are allowed",
    romaji: "Only letters, numbers, underscores, and hyphens are allowed",
    nospace: "Spaces are not allowed",
    url: "Please enter a valid URL",
    regex: "Invalid format",
    selectRequired: "This field is required",
    selectInvalid: "Please select a valid option",
    numberInput: "Please enter a number",
    dateInput: "Please select a date",
    arrayMin: (n: number) => `Please select at least ${n} items`,
    arrayMax: (n: number) => `You can select up to ${n} items`,
  },
};
