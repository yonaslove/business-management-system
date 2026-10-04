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
    # System & Branding
    "app_name": "Retail & Business Management System",
    "app_tagline": "Point of Sale & Business Operations",
    "app_subtitle": "Multi-Tier Staff Hierarchy • POS Terminal • Automated Daily Reconciliation",
    "all_rights_reserved": "All rights reserved.",
    
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
    "nav_features": "Features",
    "nav_hierarchy": "Staff Roles",
    "nav_reports": "Daily Reports",
    "nav_shop_online": "Shop Online",
    "nav_staff_portal": "Staff Portal",
    "nav_register_store": "Register Store",

    # Common Actions & Buttons
    "btn_add": "Add New",
    "btn_add_product": "Add Product",
    "btn_record_sale": "Record Sale",
    "btn_new_sale": "New Sale (POS)",
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
    "btn_copy_store_link": "Copy Storefront Link",
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
    "btn_view_all": "View all",
    "btn_retry": "Retry",
    "btn_verify_payment": "Verify Payment",
    "btn_dispatch": "Dispatch for Delivery",
    "btn_mark_delivered": "Mark Delivered",
    "btn_reject": "Reject",
    "btn_approve": "Approve",
    "btn_clear_list": "Clear List",
    "btn_manage_inventory": "Manage Inventory",
    "btn_export_pdf": "Export PDF / Print",
    "btn_add_customer": "Add Customer",
    "btn_hire_employee": "Hire Employee",

    # Statuses
    "status_in_stock": "In Stock",
    "status_low_stock": "Low Stock",
    "status_empty": "Out of Stock",
    "status_verified": "Verified",
    "status_pending_verification": "Pending Verification",
    "status_pending_approval": "Pending Approval",
    "status_dispatched": "Dispatched",
    "status_delivered": "Delivered",
    "status_cancelled": "Cancelled",
    "status_rejected": "Rejected",
    "status_all": "All",

    # Payment Methods & Accounts
    "payment_method": "Payment Method",
    "payment_cash": "Cash",
    "payment_telebirr": "Telebirr (Mobile Transfer / QR)",
    "payment_cbe_birr": "CBE Birr (Mobile Transfer)",
    "payment_bank_transfer": "Commercial Bank Transfer",
    "payment_cash_on_delivery": "Cash on Delivery",
    "payment_ref": "Transaction Reference ID",
    "payment_amount": "Amount to Transfer",
    "payment_details": "Official Store Payment Accounts",
    "payment_account_name": "Account Holder Name",
    "payment_account_number": "Account / Phone Number",
    "payment_instructions": "Payment Instructions",
    "payment_notice": "Please transfer the exact total to one of the accounts below, then copy and paste the Transaction Reference ID (SMS) into the order form.",

    # Auth & Roles
    "auth_signin_title": "Sign in to your business account",
    "auth_signin_subtitle": "Enter your username or email credentials to access the store",
    "auth_username_email": "Username or Email",
    "auth_password": "Password",
    "auth_register_title": "Register your business",
    "auth_register_subtitle": "Create an administrator account with secure role and currency setup",
    "auth_business_name": "Business Name",
    "auth_owner_name": "Owner / Manager Name",
    "auth_username": "Username",
    "auth_email": "Email Address",
    "auth_currency": "Default Store Currency",
    "auth_phone": "Phone Number",
    "auth_address": "Shop Address / Location",
    "auth_already_registered": "Already registered?",
    "auth_need_account": "Need to register a new store?",
    "auth_create_admin": "Create an Administrator Account",
    "auth_role_admin": "Store Administrator",
    "auth_role_coadmin": "Co-Manager",
    "auth_role_cashier": "Employee / Cashier",
    "auth_role_delivery": "Delivery Courier",

    # Storefront & Shopping
    "shop_title": "Online Shopping Storefront",
    "shop_subtitle": "Fast Local Delivery • Telebirr • CBE Birr • Cash on Delivery",
    "shop_cart_empty": "Your cart is empty. Add products from the store.",
    "shop_order_received": "Order Received!",
    "shop_order_pending_msg": "Your order and payment statement have been securely submitted. The store manager will verify and dispatch your items.",
    "shop_all_categories": "All Categories",
    "shop_search_placeholder": "Search grocery, drinks, electronics, snacks...",
    "shop_customer_login_title": "Customer Access & Delivery Verification",
    "shop_customer_login_desc": "Enter your full name and phone number to shop and securely track your orders.",
    "shop_enter_store": "Enter Store & Start Shopping",
    "shop_welcome_back": "Welcome Back",
    "shop_track_subtitle": "Track your real-time order verification, courier dispatch, and proof of receipt.",
    "shop_back_to_catalog": "Back to Product Catalog",
    "shop_delivery_details": "Customer & Delivery Address",
    "shop_order_summary": "Order Summary",
    "shop_payment_proof_upload": "Upload Payment Receipt / Statement Screenshot",
    "shop_delivery_proof_photo": "Upload Delivery Confirmation Photo",

    # Dashboard & Metrics
    "dash_title": "Business Dashboard",
    "dash_overview": "Live Retail Overview",
    "dash_total_revenue": "Total Revenue",
    "dash_total_sales": "Total Sales",
    "dash_inventory_products": "Inventory Products",
    "dash_low_stock_items": "Low Stock Items",
    "dash_sales_trend": "Sales Trend",
    "dash_recent_transactions": "Recent Transactions",
    "dash_stock_alerts": "Stock Alerts",
    "dash_no_sales": "No sales recorded yet.",
    "dash_all_stocked": "All products are comfortably stocked!",
    "dash_healthy": "Inventory healthy",
    "dash_action_needed": "Action recommended",

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
    "label_role": "Role / Position",
    "label_customer": "Customer",
    "label_items": "Items",
    "label_sku": "SKU / Barcode",
    "label_stock": "Stock Quantity",
    "label_threshold": "Low Stock Threshold",
    "label_actions": "Actions",
    "label_status": "Status",

    # Theme & Language
    "theme": "Theme",
    "theme_light": "Light Mode",
    "theme_dark": "Dark Mode",
    "language": "Language",
    "lang_en": "English",
    "lang_am": "አማርኛ (Amharic)"
}

AMHARIC_TRANSLATIONS: Dict[str, str] = {
    # System & Branding
    "app_name": "የችርቻሮ እና የንግድ ሥራ አስተዳደር ሥርዓት",
    "app_tagline": "የሽያጭ መመዝገቢያ (POS) እና የንግድ ሥራዎች",
    "app_subtitle": "የተደራጀ የሰራተኞች እርከን • የሽያጭ ተርሚናል • የቀን የሂሳብ ማጠቃለያ",
    "all_rights_reserved": "መብቱ በህግ የተጠበቀ ነው።",

    # Navigation
    "nav_dashboard": "ዳሽቦርድ",
    "nav_sales": "ሽያጭ እና ፖስ (POS)",
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
    "nav_features": "ዋና ገፅታዎች",
    "nav_hierarchy": "የሰራተኞች ሚና",
    "nav_reports": "የቀን ሪፖርቶች",
    "nav_shop_online": "በኦንላይን ይሸምቱ",
    "nav_staff_portal": "የሰራተኞች መግቢያ",
    "nav_register_store": "መደብር መዝግብ",

    # Common Actions & Buttons
    "btn_add": "አዲስ ጨምር",
    "btn_add_product": "ምርት ጨምር",
    "btn_record_sale": "ሽያጭ መዝግብ",
    "btn_new_sale": "አዲስ ሽያጭ (POS)",
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
    "btn_copy_store_link": "የመደብሩን ሊንክ ቅዳ",
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
    "btn_view_all": "ሁሉንም እይ",
    "btn_retry": "እንደገና ሞክር",
    "btn_verify_payment": "ክፍያ አረጋግጥ",
    "btn_dispatch": "ለማድረስ ላክ",
    "btn_mark_delivered": "መድረሱን አረጋግጥ",
    "btn_reject": "ውድቅ አድርግ",
    "btn_approve": "አጽድቅ",
    "btn_clear_list": "ዝርዝሩን አጽዳ",
    "btn_manage_inventory": "ክምችት አስተዳድር",
    "btn_export_pdf": "PDF አውርድ / አትም",
    "btn_add_customer": "ደንበኛ መዝግብ",
    "btn_hire_employee": "ሰራተኛ ቅጠር",

    # Statuses
    "status_in_stock": "በክምችት ላይ አለ",
    "status_low_stock": "አነስተኛ ክምችት",
    "status_empty": "አልቋል",
    "status_verified": "የተረጋገጠ",
    "status_pending_verification": "ማረጋገጫ በመጠባበቅ ላይ",
    "status_pending_approval": "ይሁንታ በመጠባበቅ ላይ",
    "status_dispatched": "ለማድረስ ተልኳል",
    "status_delivered": "ደርሷል",
    "status_cancelled": "ተሰርዟል",
    "status_rejected": "ውድቅ የተደረገ",
    "status_all": "ሁሉም",

    # Payment Methods & Accounts
    "payment_method": "የክፍያ ዘዴ",
    "payment_cash": "ጥሬ ገንዘብ",
    "payment_telebirr": "ቴሌብር (የሞባይል ዝውውር / QR)",
    "payment_cbe_birr": "ሲቢኢ ብር (የሞባይል ዝውውር)",
    "payment_bank_transfer": "የንግድ ባንክ / ሌሎች ባንኮች ዝውውር",
    "payment_cash_on_delivery": "ሲደርስ በጥሬ ገንዘብ",
    "payment_ref": "የትራንዛክሽን ማጣቀሻ ቁጥር (Ref ID)",
    "payment_amount": "የሚተላለፍ የገንዘብ መጠን",
    "payment_details": "የመደብሩ ይፋዊ የክፍያ አካውንቶች",
    "payment_account_name": "የሂሳብ ባለቤት ስም",
    "payment_account_number": "የሂሳብ / የስልክ ቁጥር",
    "payment_instructions": "የክፍያ መመሪያ",
    "payment_notice": "እባክዎ ትክክለኛውን የክፍያ መጠን ከታች ወዳሉት አካውንቶች ያስተላልፉ፣ ከዚያም የደረሰዎትን የማጣቀሻ ቁጥር (Ref ID) በቅጹ ላይ ያስገቡ።",

    # Auth & Roles
    "auth_signin_title": "ወደ ንግድ መለያዎ ይግቡ",
    "auth_signin_subtitle": "የተጠቃሚ ስም ወይም ኢሜይል ተጠቅመው ወደ መደብሩ ይግቡ",
    "auth_username_email": "የተጠቃሚ ስም ወይም ኢሜይል",
    "auth_password": "የይለፍ ቃል",
    "auth_register_title": "የንግድ ድርጅትዎን ይመዝግቡ",
    "auth_register_subtitle": "የአስተዳዳሪ አካውንት፣ ሚና እና የገንዘብ አይነት ያዋቅሩ",
    "auth_business_name": "የድርጅቱ ስም",
    "auth_owner_name": "የባለቤቱ / ስራ አስኪያጁ ሙሉ ስም",
    "auth_username": "የተጠቃሚ ስም",
    "auth_email": "የኢሜይል አድራሻ",
    "auth_currency": "መደበኛ የገንዘብ አይነት",
    "auth_phone": "የስልክ ቁጥር",
    "auth_address": "የመደብሩ አድራሻ / ቦታ",
    "auth_already_registered": "አስቀድመው ተመዝግበዋል?",
    "auth_need_account": "አዲስ መደብር መመዝገብ ይፈልጋሉ?",
    "auth_create_admin": "የአስተዳዳሪ መለያ ይፍጠሩ",
    "auth_role_admin": "ዋና አስተዳዳሪ (Admin)",
    "auth_role_coadmin": "ረዳት ስራ አስኪያጅ (Co-Manager)",
    "auth_role_cashier": "ሰራተኛ / ገንዘብ ተቀባይ (Cashier)",
    "auth_role_delivery": "አድራሽ / ሹፌር (Delivery)",

    # Storefront & Shopping
    "shop_title": "የኦንላይን መገበያያ መደብር",
    "shop_subtitle": "ፈጣን የቤት ለቤት ማድረስ • በቴሌብር • በሲቢኢ ብር • በጥሬ ገንዘብ",
    "shop_cart_empty": "የእርስዎ ጋሪ ባዶ ነው። እባክዎ ከመደብሩ ምርቶችን ይጨምሩ።",
    "shop_order_received": "ትዕዛዝዎ በተሳካ ሁኔታ ደርሷል!",
    "shop_order_pending_msg": "ትዕዛዝዎ እና የክፍያ ማረጋገጫዎ በአስተማማኝ ሁኔታ ተልኳል። አስተዳዳሪው ፈትሾ ለሹፌር ይሰጣል።",
    "shop_all_categories": "ሁሉም ምድቦች",
    "shop_search_placeholder": "ምግቦች፣ መጠጦች፣ ኤሌክትሮኒክስ፣ ሸቀጣ ሸቀጥ ይፈልጉ...",
    "shop_customer_login_title": "የደንበኛ መለያና የማድረሻ ማረጋገጫ",
    "shop_customer_login_desc": "ለመገበያየት እና ትዕዛዝዎን ለመከታተል ሙሉ ስምዎንና ስልክዎን ያስገቡ።",
    "shop_enter_store": "ወደ መደብሩ ግባና ሸምት",
    "shop_welcome_back": "እንኳን ደህና መጡ",
    "shop_track_subtitle": "የትዕዛዝዎን ሁኔታ፣ የክፍያ ማረጋገጫና ርክክብን በቀጥታ ይከታተሉ።",
    "shop_back_to_catalog": "ወደ ምርቶች ዝርዝር ተመለስ",
    "shop_delivery_details": "የደንበኛ እና የማድረሻ አድራሻ",
    "shop_order_summary": "የትዕዛዝ ማጠቃለያ",
    "shop_payment_proof_upload": "የክፍያ ደረሰኝ / ስቴትመንት ፎቶ ጫን",
    "shop_delivery_proof_photo": "የእቃ ርክክብ ማረጋገጫ ፎቶ ጫን",

    # Dashboard & Metrics
    "dash_title": "የንግድ ዳሽቦርድ",
    "dash_overview": "የቀጥታ የሽያጭ እና ክምችት አጠቃላይ እይታ",
    "dash_total_revenue": "አጠቃላይ ገቢ",
    "dash_total_sales": "ጠቅላላ ሽያጭ",
    "dash_inventory_products": "በክምችት ያሉ ምርቶች",
    "dash_low_stock_items": "አነስተኛ ክምችት ያላቸው",
    "dash_sales_trend": "የሽያጭ ሂደት",
    "dash_recent_transactions": "የቅርብ ጊዜ ሽያጮች",
    "dash_stock_alerts": "የክምችት ማስጠንቀቂያዎች",
    "dash_no_sales": "እስካሁን ምንም ሽያጭ አልተመዘገበም።",
    "dash_all_stocked": "ሁሉም ምርቶች በበቂ ክምችት ላይ ይገኛሉ!",
    "dash_healthy": "ክምችቱ አስተማማኝ ነው",
    "dash_action_needed": "እርምጃ ያስፈልጋል",

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
    "label_customer": "ደንበኛ",
    "label_items": "ዕቃዎች",
    "label_sku": "የባርኮድ / SKU ቁጥር",
    "label_stock": "የክምችት መጠን",
    "label_threshold": "የማስጠንቀቂያ ጣሪያ",
    "label_actions": "ተግባራት",
    "label_status": "ሁኔታ",

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
