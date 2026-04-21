System Name: Project Zeus (v13.0)
Architecture Style: Monolithic Offline-First Mobile Client with Cloud Synchronization.

1. The Data Ingestion Layer (The Radar):
Zeus does not rely on unreliable bank APIs. It uses a Native Android Bridge (react-native-android-sms-listener) to intercept banking SMS payloads in real-time. If the app is killed by the OS, a background reconciliation engine (react-native-get-sms-android) scans the inbox upon the next boot, comparing local SQLite/AsyncStorage timestamps with the inbox to backfill missed data.

2. The Regex Parsing Engine (parser.js):
Raw SMS strings are fed into a customized Regular Expression (Regex) engine. It extracts the quantitative value, classifies the boolean flow (Debit/Credit), and identifies the source (Bank A/C, Visa, Amazon Pay, Cash).

3. The Neural Mapping Node (Vendor Memory):
Instead of hardcoding categories, the app features a dynamic Hash Map (vendorMap stored in AsyncStorage). When a user manually re-categorizes a transaction (e.g., changing "Zomato" to "🍔 FOOD"), the engine updates the Hash Map. All future background ingestion runs through this map first, creating a self-learning categorization loop.

4. State Management & Decoupling:
The system separates Liquid State (Actual Bank/Cash balances) from Theoretical State (Income goals, Custom Mandates). This prevents data corruption. Liquid state is calculated via strict Double-Entry accounting logic derived from the Supabase database.