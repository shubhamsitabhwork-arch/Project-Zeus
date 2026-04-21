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

Biometric Sentinel: Hardware-level protection using expo-local-authentication, ensuring data privacy even if the phone is unlocked.

Contextual UI: Reactive interface that shifts states based on financial "health" (Velocity tracking).

### 🧠 System Intelligence Flow
```mermaid
graph TD
    A[Bank SMS] -->|Native Bridge| B(SmsService.js)
    B -->|Regex Translation| C{Parser.js}
    C -->|Neural Mapping| D[Local AsyncStorage]
    C -->|Cloud Backup| E[Supabase PostgreSQL]
    D -->|Quantitative Analysis| F[MathEngine.js]
    F -->|Forecasting| G[Dashboard / Analytics UI]
    G -->|Data Portability| H[PDF/CSV Export]

    ### 🧬 Project Zeus: Neural Data Flow
```mermaid
sequenceDiagram
    participant B as Bank SMS
    participant R as SMS Radar (Service)
    participant P as Regex Parser (Brain)
    participant M as Memory (AsyncStorage)
    participant V as Cloud Vault (Supabase)
    participant UI as Neural Analytics (Screen)

    B->>R: Raw Text Intercepted
    R->>P: Filter via Genesis Date
    P->>M: Check Vendor Map
    P->>V: Hash & Sync Record
    M->>UI: Quantitative Breakdown
    UI->>UI: SVG Vector Rendering

    # ⚡ Project Zeus: Neural Financial Operating System
**Built with React Native, Supabase, and Hardware-level Biometrics.**

Project Zeus is an enterprise-grade financial management platform designed to automate the gap between raw banking data and personal financial intelligence. It utilizes a native SMS bridge to eliminate manual entry, providing a 100% automated, offline-first experience.

## 🛠 Technical Architecture
* **Language & Framework:** React Native (Expo)
* **Database:** Supabase (PostgreSQL) with Real-time Sync
* **Security:** AES-256 Cloud Encryption & Biometric Hardware Gate (FaceID/Fingerprint)
* **Data Ingestion:** Regex-based NLP Parser for Banking SMS payloads
* **State Management:** Decoupled Monolithic Architecture with AsyncStorage Persistence

## 🚀 Key Engineering Features
1.  **Neural Vendor Mapping:** A self-learning categorization engine that remembers user preferences via a Hash-Map logic.
2.  **Genesis Point Logic:** Automated data reconciliation that filters historical "noise," ensuring a clean financial start point.
3.  **Behavioral Analytics:** Predictive runway math and archetype identification based on 30-day burn-rate modeling.
4.  **Social Ledger:** A decoupled P2P debt tracker that separates assets/liabilities from liquid bank math.
5.  **Reactive Guardrails:** Local notification engine alerting users to budget breaches in real-time.

## 🧬 System Intelligence Flow
```mermaid
graph TD
    A[Bank SMS] -->|Native Bridge| B(SmsService.js)
    B -->|Regex Translation| C{Parser.js}
    C -->|Neural Mapping| D[Local AsyncStorage]
    C -->|Cloud Backup| E[Supabase PostgreSQL]
    D -->|Behavioral Analysis| F[MathEngine.js]
    F -->|Forecasting| G[Dashboard / Insights UI]