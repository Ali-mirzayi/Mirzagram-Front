import { I18n } from "i18n-js";
import en from './locales/en.json';
import fa from './locales/fa.json';
import { useSetLocale } from "../socketContext";

const useTranslate = () => {
    const {locale,setLocale} = useSetLocale();

    const i18n = new I18n({
        en,
        fa,
    });
    i18n.enableFallback = true;
    i18n.translations = { en, fa };
    i18n.locale = locale;
    return { i18n, locale, setLocale }
}

export { useTranslate };
