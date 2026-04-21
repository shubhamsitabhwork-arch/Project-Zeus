⚡ Project Zeus: Neural Financial Operating System (v20.0)
An Enterprise-Grade, Automated Personal Finance Intelligence Unit.

Project Zeus is a high-fidelity, biometric-secured Financial OS built to eliminate the friction of manual expense tracking. By leveraging a native Android bridge, it intercepts banking SMS payloads in real-time, translating raw text into structured quantitative insights using a proprietary Regex-based Neural Mapping engine.

🏗️ Technical Architecture (High-Level)
Zeus follows a Decoupled Monolithic Architecture, separating UI concerns from the hardware-level data ingestion services.
graph TD
    A[Native SMS Bridge] -->|Stateless Payload| B(SmsService.js)
    B -->|Genesis Filtering| C{Regex Brain}
    C -->|Neural Map| D[AsyncStorage Cache]
    C -->|E2E Encrypted| E[Supabase Cloud Vault]
    D -->|Quantitative Modeling| F[MathEngine.js]
    F -->|Archetype Analysis| G[Insights & Analytics UI]
    G -->|Data Portability| H[Export Service CSV]

🧬 Neural Data Flow (Sequence Diagram)
How a single transaction moves through the system:
sequenceDiagram
    participant B as Bank SMS
    participant R as SMS Sentinel (Service)
    participant P as Regex Parser (Brain)
    participant M as Memory (Local Storage)
    participant V as Cloud Vault (Supabase)
    participant UI as Passbook UI

    B->>R: 1. Raw Text Intercepted
    R->>P: 2. Filter via Genesis Date
    P->>M: 3. Check Neural Vendor Map
    P->>V: 4. SHA-256 Hash & Sync
    V->>UI: 5. Synchronized State Update
    UI->>UI: 6. Apply Behavioral Analytics

🚀 Core Engineering Features
🛡️ The Sentinel Layer (Security)
Hardware Biometrics: Integrated expo-local-authentication for mandatory FaceID/Fingerprint gates.

Genesis Point Control: A user-defined "System Start Point" that prevents historical data leakage and ensures a clean ledger.

Data Integrity: Implemented Non-Cascading Deletion to allow record removal without corrupting liquid balances.

🧠 Intelligence & Analytics
Behavioral Archetypes: Real-time analysis of spending velocity (Defensive, Balanced, Aggressive, Critical).

Liquidity Runway: Predictive math engine forecasting "Days-to-Zero" based on 14-day average burn rates.

Neural Mapping: Self-learning vendor categorization that maps raw merchant IDs (e.g., Zomato, Amazon) to user-defined categories.

💼 Professional Ledger Management
Social Ledger: Decoupled Peer-to-Peer debt tracker (Owed/Borrowed) that operates independently of bank liquidity.

Mandate Intelligence: Automated tracking of recurring subscriptions with archiving and status-toggling.

Reactive Guardrails: Local notification engine alerting users when category-specific budgets exceed 90% utilization.

📂 Project Directory Structure
The project follows a modularized standard for React Native engineering:

    zeus-mobile/
├── App.js                   # Main Entry Point & Orchestrator
├── parser.js                # The Regex Brain (SMS Translator)
├── supabase.js              # Cloud Database Configuration
├── src/
│   ├── components/          # Reusable UI Atoms (Modals, Sidebar)
│   │   ├── ManualTxModal.js
│   │   ├── Sidebar.js
│   │   └── VendorModal.js
│   ├── screens/             # Modular Page Modules
│   │   ├── Dashboard.js     # The Control Tower
│   │   ├── Passbook.js      # Renamed Chronological Ledger
│   │   ├── Wallets.js       # Liquidity & CC Limit Manager
│   │   ├── Analytics.js     # Vector Distribution Hub
│   │   ├── Insights.js      # Behavioral Archetype Engine
│   │   └── Owed.js          # Social P2P Ledger
│   ├── services/            # Pure Logic Engines (Decoupled)
│   │   ├── MathEngine.js    # Financial Modeling
│   │   ├── SmsService.js    # Native Hardware Bridge
│   │   ├── SecurityService.js # Biometric Authentication
│   │   ├── ExportService.js # Data Portability (CSV)
│   │   └── NotificationService.js # Push Sentinel
│   └── styles/              # Global Design Tokens
│       └── theme.js         # Reactive Dark/Light Mode

Version,Milestone,Key Feature
v1.0,Initial Forge,Basic SMS listening & Supabase sync.
v13.0,Stabilization,Fixed background sync & Daily Velocity logic.
v15.0,Modular Breakout,Decoupled App.js into src/screens architecture.
v17.0,Intelligence Hub,Implemented Vector Analytics & Runway Forecasting.
v19.0,The Sentinel,Added Biometrics & Behavioral Archetype tracking.
v20.0,Production,Genesis point filtering & Social Ledger integration.

🛠️ Installation & Build
Clone the Repo: git clone https://github.com/shubhamsitabhwork-arch/Project-Zeus.git

Install Dependencies: npm install

Hardware Config: Ensure Android permissions for SMS and Biometrics are enabled.

Environment: Set up supabase.js with your Project URL and API Key.

Launch: npx expo start or eas build -p android

Created and Maintained by Shubham Sitabh — Software Architect & Personal Finance Evangelist.