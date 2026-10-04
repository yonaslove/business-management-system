from fastapi import APIRouter, HTTPException
from typing import Dict, List

router = APIRouter(prefix="/translations", tags=["Language & Localization"])

SUPPORTED_LANGUAGES = [
    {
        "code": "en",
        "name": "English",
        "native": "English",
        "flag": "🇬🇧"
    },
    {
        "code": "am",
        "name": "Amharic",
        "native": "አማርኛ",
        "flag": "🇪🇹"
    }
]

ENGLISH_TRANSLATIONS: Dict[str, str] = {
    # Navigation
    "nav_dashboard": "Dashboard",
    "nav_sales": "Sales & POS",
    "nav_products": "Products & Stock",
    "nav_customers": "Customers",
    "nav_orders": "Online Orders",
    "nav_delivery": "Delivery Portal",
    "nav_employees": "Staff Members",
    "nav_admin": "Admin Hub",
    "nav_settings": "Settings",
    "nav_storefront": "Online Store",
    "nav_track_orders": "Track Orders",
    "nav_payment_accounts": "Payment Accounts",
    "nav_cart": "Cart",
    
    # Common Actions & Buttons
    "btn_add": "Add New",
    "btn_add_product": "Add Product",
    "btn_record_sale": "Record Sale",
    "btn_edit": "Edit",
    "btn_delete": "Delete",
    "btn_save": "Save Changes",
    "btn_saving": "Saving...",
    "btn_cancel": "Cancel",
    "btn_search": "Search...",
    "btn_filter": "Filter",
    "btn_refresh": "Refresh",
    "btn_copy": "Copy",
    "btn_copied": "Copied!",
    "btn_copy_amount": "Copy Amount",
    "btn_sign_in": "Sign In",
    "btn_sign_out": "Sign Out",
    "btn_register": "Register",
    "btn_checkout": "Checkout",
    "btn_place_order": "Confirm & Place Order",
    "btn_add_to_cart": "Add to Cart",
    "btn_view_receipt": "View Receipt",
    "btn_upload_receipt": "Upload Statement / Receipt",
    "btn_acknowledge_delivery": "Acknowledge Delivery",
    "btn_close": "Close",
    
    # Statuses
    "status_in_stock": "In Stock",
    "status_low_stock": "Low Stock",
    "status_empty": "Out of Stock",
    "status_verified": "Verified",
    "status_pending_verification": "Pending Verification",
    "status_dispatched": "Dispatched",
    "status_delivered": "Delivered",
    "status_cancelled": "Cancelled",
    
    # Payment Methods
    "payment_method": "Payment Method",
    "payment_telebirr": "Telebirr (Mobile Transfer / QR)",
    "payment_cbe_birr": "CBE Birr (Mobile Transfer)",
    "payment_bank_transfer": "Commercial Bank Transfer",
    "payment_cash_on_delivery": "Cash on Delivery",
    "payment_ref": "Transaction Reference ID",
    "payment_amount": "Amount to Transfer",
    "payment_details": "Payment Details",
    "payment_account_name": "Account Holder Name",
    "payment_account_number": "Account / Phone Number",
    
    # Storefront & Shopping
    "shop_title": "Online Shopping Storefront",
    "shop_subtitle": "Fast Local Delivery • Telebirr • CBE Birr • Cash on Delivery",
    "shop_cart_empty": "Your cart is empty. Add products from the store.",
    "shop_order_received": "Order Received!",
    "shop_order_pending_msg": "Your order and payment statement have been securely submitted.",
    "shop_all_categories": "All Categories",
    
    # General labels
    "label_total": "Total",
    "label_subtotal": "Subtotal",
    "label_price": "Price",
    "label_quantity": "Quantity",
    "label_category": "Category",
    "label_name": "Full Name",
    "label_phone": "Phone Number",
    "label_address": "Delivery Address",
    "label_notes": "Notes / Instructions",
    "label_date": "Date",
    "label_currency": "Currency",
    "label_role": "Role",
    
    # Theme & Language
    "theme": "Theme",
    "theme_light": "Light Mode",
    "theme_dark": "Dark Mode",
    "language": "Language",
    "lang_en": "English",
    "lang_am": "አማርኛ (Amharic)"
}

AMHARIC_TRANSLATIONS: Dict[str, str] = {
    # Navigation
    "nav_dashboard": "ዳሽቦርድ",
    "nav_sales": "ሽያጭ እና ፖስ",
    "nav_products": "ምርቶችና ክምችት",
    "nav_customers": "ደንበኞች",
    "nav_orders": "የኦንላይን ትዕዛዞች",
    "nav_delivery": "የማድረሻ ፖርታል",
    "nav_employees": "ሰራተኞች",
    "nav_admin": "የአስተዳዳሪ ማዕከል",
    "nav_settings": "ማስተካከያ",
    "nav_storefront": "የኦንላይን መደብር",
    "nav_track_orders": "ትዕዛዝ መከታተያ",
    "nav_payment_accounts": "የክፍያ አካውንቶች",
    "nav_cart": "ጋሪ",
    
    # Common Actions & Buttons
    "btn_add": "አዲስ ጨምር",
    "btn_add_product": "ምርት ጨምር",
    "btn_record_sale": "ሽያጭ መዝግብ",
    "btn_edit": "አስተካክል",
    "btn_delete": "ሰርዝ",
    "btn_save": "ለውጦችን አስቀምጥ",
    "btn_saving": "በማስቀመጥ ላይ...",
    "btn_cancel": "ይቅር",
    "btn_search": "ፈልግ...",
    "btn_filter": "አጣራ",
    "btn_refresh": "አድስ",
    "btn_copy": "ቅዳ",
    "btn_copied": "ተቀድቷል!",
    "btn_copy_amount": "መጠኑን ቅዳ",
    "btn_sign_in": "ግባ",
    "btn_sign_out": "ውጣ",
    "btn_register": "ተመዝገብ",
    "btn_checkout": "ክፍያ ፈጽም",
    "btn_place_order": "ትዕዛዝ አረጋግጥና አስገባ",
    "btn_add_to_cart": "ወደ ጋሪ ጨምር",
    "btn_view_receipt": "ደረሰኝ እይ",
    "btn_upload_receipt": "ደረሰኝ / ስቴትመንት ጫን",
    "btn_acknowledge_delivery": "ርክክብ አረጋግጥ",
    "btn_close": "ዝጋ",
    
    # Statuses
    "status_in_stock": "በክምችት ላይ አለ",
    "status_low_stock": "አነስተኛ ክምችት",
    "status_empty": "አልቋል",
    "status_verified": "የተረጋገጠ",
    "status_pending_verification": "ማረጋገጫ በመጠባበቅ ላይ",
    "status_dispatched": "ለማድረስ ተልኳል",
    "status_delivered": "ደርሷል",
    "status_cancelled": "ተሰርዟል",
    
    # Payment Methods
    "payment_method": "የክፍያ ዘዴ",
    "payment_telebirr": "ቴሌብር (የሞባይል ዝውውር / QR)",
    "payment_cbe_birr": "ሲቢኢ ብር (የሞባይል ዝውውር)",
    "payment_bank_transfer": "የንግድ ባንክ / ሌሎች ባንኮች ዝውውር",
    "payment_cash_on_delivery": "ሲደርስ በጥሬ ገንዘብ",
    "payment_ref": "የትራንዛክሽን ማጣቀሻ ቁጥር (Ref ID)",
    "payment_amount": "የሚተላለፍ የገንዘብ መጠን",
    "payment_details": "የክፍያ ዝርዝሮች",
    "payment_account_name": "የሂሳብ ባለቤት ስም",
    "payment_account_number": "የሂሳብ / የስልክ ቁጥር",
    
    # Storefront & Shopping
    "shop_title": "የኦንላይን መገበያያ መደብር",
    "shop_subtitle": "ፈጣን የቤት ለቤት ማድረስ • በቴሌብር • በሲቢኢ ብር • በጥሬ ገንዘብ",
    "shop_cart_empty": "የእርስዎ ጋሪ ባዶ ነው። እባክዎ ከመደብሩ ምርቶችን ይጨምሩ።",
    "shop_order_received": "ትዕዛዝዎ በተሳካ ሁኔታ ደርሷል!",
    "shop_order_pending_msg": "ትዕዛዝዎ እና የክፍያ ማረጋገጫዎ በአስተማማኝ ሁኔታ ተልኳል። አስተዳዳሪው ፈትሾ ለሹፌር ይሰጣል።",
    "shop_all_categories": "ሁሉም ምድቦች",
    
    # General labels
    "label_total": "አጠቃላይ ድምር",
    "label_subtotal": "ንዑስ ድምር",
    "label_price": "ዋጋ",
    "label_quantity": "ብዛት",
    "label_category": "ምድብ",
    "label_name": "ሙሉ ስም",
    "label_phone": "ስልክ ቁጥር",
    "label_address": "የማድረሻ አድራሻ",
    "label_notes": "ማስታወሻ / መመሪያ",
    "label_date": "ቀን",
    "label_currency": "የገንዘብ አይነት",
    "label_role": "ሚና / ደረጃ",
    
    # Theme & Language
    "theme": "ገጽታ",
    "theme_light": "የቀን ገጽታ (Light)",
    "theme_dark": "የጨለማ ገጽታ (Dark)",
    "language": "ቋንቋ",
    "lang_en": "English",
    "lang_am": "አማርኛ"
}


@router.get("", response_model=List[dict])
def get_languages():
    """
    Returns list of supported languages.
    """
    return SUPPORTED_LANGUAGES


@router.get("/{lang}")
def get_translation_dictionary(lang: str):
    """
    Returns translation dictionary for requested language code (en or am).
    """
    code = lang.lower().strip()
    if code == "am":
        return {
            "lang": "am",
            "name": "Amharic",
            "translations": AMHARIC_TRANSLATIONS
        }
    elif code == "en":
        return {
            "lang": "en",
            "name": "English",
            "translations": ENGLISH_TRANSLATIONS
        }
    else:
        raise HTTPException(status_code=404, detail=f"Language '{lang}' is not supported. Use 'am' or 'en'.")
