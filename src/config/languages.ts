/**
 * RateHawk Supported Languages
 * Based on RateHawk API documentation
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const RATEHAWK_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "bg", name: "Bulgarian", nativeName: "Български" },
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "he", name: "Hebrew", nativeName: "עברית" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақша" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "pt_PT", name: "Portuguese (Portugal)", nativeName: "Português (Portugal)" },
  { code: "ro", name: "Romanian", nativeName: "Română" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "sq", name: "Albanian", nativeName: "Shqip" },
  { code: "sr", name: "Serbian", nativeName: "Српски" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "zh_CN", name: "Simplified Chinese", nativeName: "简体中文" },
  { code: "zh_TW", name: "Traditional Chinese", nativeName: "繁體中文" },
];

// Get language by code
export function getLanguageByCode(code: string): Language | undefined {
  return RATEHAWK_LANGUAGES.find(lang => lang.code === code);
}

// Get default language
export function getDefaultLanguage(): Language {
  return RATEHAWK_LANGUAGES[0]; // English
}
