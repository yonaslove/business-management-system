'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiRequest } from './api';

export type Language = 'en' | 'am';

export interface SupportedLanguage {
  code: Language;
  name: string;
  native: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ', flag: '🇪🇹' }
];

// Built-in immediate translations for instantaneous UI rendering
const DEFAULT_EN: Record<string, string> = {
  nav_dashboard: "Dashboard",
  nav_sales: "Sales & POS",
  nav_products: "Products & Stock",
  nav_customers: "Customers",
  nav_orders: "Online Orders",
  nav_delivery: "Delivery Portal",
  nav_employees: "Staff Members",
  nav_admin: "Admin Hub",
  nav_settings: "Settings",
  nav_storefront: "Online Store",
  nav_track_orders: "Track Orders",
  nav_payment_accounts: "Payment Accounts",
  nav_cart: "Cart",
  
  btn_add: "Add New",
  btn_add_product: "Add Product",
  btn_record_sale: "Record Sale",
  btn_edit: "Edit",
  btn_delete: "Delete",
  btn_save: "Save Changes",
  btn_saving: "Saving...",
  btn_cancel: "Cancel",
  btn_search: "Search...",
  btn_filter: "Filter",
  btn_refresh: "Refresh",
  btn_copy: "Copy",
  btn_copied: "Copied!",
  btn_copy_amount: "Copy Amount",
  btn_sign_in: "Sign In",
  btn_sign_out: "Sign Out",
  btn_register: "Register",
  btn_checkout: "Checkout",
  btn_place_order: "Confirm & Place Order",
  btn_add_to_cart: "Add to Cart",
  btn_view_receipt: "View Receipt",
  btn_upload_receipt: "Upload Receipt",
  btn_acknowledge_delivery: "Acknowledge Delivery",
  btn_close: "Close",
  
  status_in_stock: "In Stock",
  status_low_stock: "Low Stock",
  status_empty: "Out of Stock",
  status_verified: "Verified",
  status_pending_verification: "Pending Verification",
  status_dispatched: "Dispatched",
  status_delivered: "Delivered",
  status_cancelled: "Cancelled",
  
  payment_method: "Payment Method",
  payment_telebirr: "Telebirr (Mobile Transfer / QR)",
  payment_cbe_birr: "CBE Birr (Mobile Transfer)",
  payment_bank_transfer: "Commercial Bank Transfer",
  payment_cash_on_delivery: "Cash on Delivery",
  payment_ref: "Transaction Reference ID",
  payment_amount: "Amount to Transfer",
  payment_details: "Payment Details",
  payment_account_name: "Account Holder Name",
  payment_account_number: "Account / Phone Number",
  
  shop_title: "Online Shopping Storefront",
  shop_subtitle: "Fast Local Delivery • Telebirr • CBE Birr • Cash on Delivery",
  shop_cart_empty: "Your cart is empty. Add products from the store.",
  shop_order_received: "Order Received!",
  shop_order_pending_msg: "Your order and payment statement have been securely submitted.",
  shop_all_categories: "All Categories",
  
  label_total: "Total",
  label_subtotal: "Subtotal",
  label_price: "Price",
  label_quantity: "Quantity",
  label_category: "Category",
  label_name: "Full Name",
  label_phone: "Phone Number",
  label_address: "Delivery Address",
  label_notes: "Notes / Instructions",
  label_date: "Date",
  label_currency: "Currency",
  label_role: "Role",
  
  theme: "Theme",
  theme_light: "Light Mode",
  theme_dark: "Dark Mode",
  language: "Language",
  lang_en: "English",
  lang_am: "አማርኛ"
};

const DEFAULT_AM: Record<string, string> = {
  nav_dashboard: "ዳሽቦርድ",
  nav_sales: "ሽያጭ እና ፖስ",
  nav_products: "ምርቶችና ክምችት",
  nav_customers: "ደንበኞች",
  nav_orders: "የኦንላይን ትዕዛዞች",
  nav_delivery: "የማድረሻ ፖርታል",
  nav_employees: "ሰራተኞች",
  nav_admin: "የአስተዳዳሪ ማዕከል",
  nav_settings: "ማስተካከያ",
  nav_storefront: "የኦንላይን መደብር",
  nav_track_orders: "ትዕዛዝ መከታተያ",
  nav_payment_accounts: "የክፍያ አካውንቶች",
  nav_cart: "ጋሪ",
  
  btn_add: "አዲስ ጨምር",
  btn_add_product: "ምርት ጨምር",
  btn_record_sale: "ሽያጭ መዝግብ",
  btn_edit: "አስተካክል",
  btn_delete: "ሰርዝ",
  btn_save: "ለውጦችን አስቀምጥ",
  btn_saving: "በማስቀመጥ ላይ...",
  btn_cancel: "ይቅር",
  btn_search: "ፈልግ...",
  btn_filter: "አጣራ",
  btn_refresh: "አድስ",
  btn_copy: "ቅዳ",
  btn_copied: "ተቀድቷል!",
  btn_copy_amount: "መጠኑን ቅዳ",
  btn_sign_in: "ግባ",
  btn_sign_out: "ውጣ",
  btn_register: "ተመዝገብ",
  btn_checkout: "ክፍያ ፈጽም",
  btn_place_order: "ትዕዛዝ አረጋግጥና አስገባ",
  btn_add_to_cart: "ወደ ጋሪ ጨምር",
  btn_view_receipt: "ደረሰኝ እይ",
  btn_upload_receipt: "ደረሰኝ ጫን",
  btn_acknowledge_delivery: "ርክክብ አረጋግጥ",
  btn_close: "ዝጋ",
  
  status_in_stock: "በክምችት ላይ አለ",
  status_low_stock: "አነስተኛ ክምችት",
  status_empty: "አልቋል",
  status_verified: "የተረጋገጠ",
  status_pending_verification: "ማረጋገጫ በመጠባበቅ ላይ",
  status_dispatched: "ለማድረስ ተልኳል",
  status_delivered: "ደርሷል",
  status_cancelled: "ተሰርዟል",
  
  payment_method: "የክፍያ ዘዴ",
  payment_telebirr: "ቴሌብር (የሞባይል ዝውውር / QR)",
  payment_cbe_birr: "ሲቢኢ ብር (የሞባይል ዝውውር)",
  payment_bank_transfer: "የንግድ ባንክ / ሌሎች ባንኮች ዝውውር",
  payment_cash_on_delivery: "ሲደርስ በጥሬ ገንዘብ",
  payment_ref: "የትራንዛክሽን ማጣቀሻ ቁጥር (Ref ID)",
  payment_amount: "የሚተላለፍ የገንዘብ መጠን",
  payment_details: "የክፍያ ዝርዝሮች",
  payment_account_name: "የሂሳብ ባለቤት ስም",
  payment_account_number: "የሂሳብ / የስልክ ቁጥር",
  
  shop_title: "የኦንላይን መገበያያ መደብር",
  shop_subtitle: "ፈጣን የቤት ለቤት ማድረስ • በቴሌብር • በሲቢኢ ብር • በጥሬ ገንዘብ",
  shop_cart_empty: "የእርስዎ ጋሪ ባዶ ነው። እባክዎ ከመደብሩ ምርቶችን ይጨምሩ።",
  shop_order_received: "ትዕዛዝዎ በተሳካ ሁኔታ ደርሷል!",
  shop_order_pending_msg: "ትዕዛዝዎ እና የክፍያ ማረጋገጫዎ በአስተማማኝ ሁኔታ ተልኳል። አስተዳዳሪው ፈትሾ ለሹፌር ይሰጣል።",
  shop_all_categories: "ሁሉም ምድቦች",
  
  label_total: "አጠቃላይ ድምር",
  label_subtotal: "ንዑስ ድምር",
  label_price: "ዋጋ",
  label_quantity: "ብዛት",
  label_category: "ምድብ",
  label_name: "ሙሉ ስም",
  label_phone: "ስልክ ቁጥር",
  label_address: "የማድረሻ አድራሻ",
  label_notes: "ማስታወሻ / መመሪያ",
  label_date: "ቀን",
  label_currency: "የገንዘብ አይነት",
  label_role: "ሚና / ደረጃ",
  
  theme: "ገጽታ",
  theme_light: "የቀን ገጽታ",
  theme_dark: "የጨለማ ገጽታ",
  language: "ቋንቋ",
  lang_en: "English",
  lang_am: "አማርኛ"
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
  supportedLanguages: SupportedLanguage[];
  loadingTranslations: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, defaultText) => defaultText || key,
  supportedLanguages: SUPPORTED_LANGUAGES,
  loadingTranslations: false
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [dictionary, setDictionary] = useState<Record<string, string>>(DEFAULT_EN);
  const [loadingTranslations, setLoadingTranslations] = useState<boolean>(false);

  // Load language preference from storage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('bms_lang') as Language | null;
      if (savedLang === 'am' || savedLang === 'en') {
        setLanguageState(savedLang);
        setDictionary(savedLang === 'am' ? DEFAULT_AM : DEFAULT_EN);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch updated translations from backend API whenever language changes
  useEffect(() => {
    const fetchApiTranslations = async () => {
      setLoadingTranslations(true);
      try {
        const res = await apiRequest<{ lang: string; name: string; translations: Record<string, string> }>(
          `/translations/${language}`
        );
        if (res && res.translations) {
          setDictionary((prev) => ({
            ...prev,
            ...res.translations
          }));
        }
      } catch (err) {
        // Fallback already populated via DEFAULT_EN / DEFAULT_AM
      } finally {
        setLoadingTranslations(false);
      }
    };

    fetchApiTranslations();
  }, [language]);

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    setDictionary(newLang === 'am' ? DEFAULT_AM : DEFAULT_EN);
    try {
      localStorage.setItem('bms_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      if (dictionary[key]) {
        return dictionary[key];
      }
      if (language === 'am' && DEFAULT_AM[key]) {
        return DEFAULT_AM[key];
      }
      if (DEFAULT_EN[key]) {
        return DEFAULT_EN[key];
      }
      return defaultText || key;
    },
    [dictionary, language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
        loadingTranslations
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
