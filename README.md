# ⚡ Project Zeus: Neural Financial Operating System (v20.0)
**An Enterprise-Grade, Automated Personal Finance Intelligence Unit.**

Project Zeus is a high-fidelity, biometric-secured Financial OS built to eliminate the friction of manual expense tracking. By leveraging a native Android bridge, it intercepts banking SMS payloads in real-time, translating raw text into structured quantitative insights using a proprietary Regex-based Neural Mapping engine.

---

## 🏗️ Technical Architecture
Zeus follows a **Decoupled Monolithic Architecture**, separating UI concerns from hardware-level data ingestion services.



🧬 Neural Data Flow
How a single transaction moves through the system:

sequenceDiagram
    participant B as Bank SMS
    participant R as SMS Sentinel
    participant P as Regex Parser
    participant M as Memory
    participant V as Cloud Vault
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

Genesis Point Control: A user-defined "System Start Point" that prevents historical data leakage.

Data Integrity: Implemented Non-Cascading Deletion for clean record management.

🧠 Intelligence & Analytics
Behavioral Archetypes: Real-time analysis of spending velocity (Defensive, Balanced, Aggressive).

Liquidity Runway: Predictive math engine forecasting "Days-to-Zero" based on 14-day burn rates.

Neural Mapping: Self-learning vendor categorization using dynamic Hash-Map logic.

📂 Project Directory Structure

zeus-mobile/
├── App.js                   # Main Entry Point & Orchestrator
├── parser.js                # The Regex Brain (SMS Translator)
├── src/
│   ├── components/          # Reusable UI Atoms
│   │   ├── ManualTxModal.js
│   │   └── Sidebar.js
│   ├── screens/             # Modular Page Modules
│   │   ├── Dashboard.js
│   │   ├── Passbook.js      # The Ledger
│   │   └── Analytics.js
│   ├── services/            # Pure Logic Engines
│   │   ├── MathEngine.js
│   │   └── SmsService.js
│   └── styles/              # Global Design Tokens
│       └── theme.js


📊 Version History
Version,Milestone,Key Feature
v1.0,Initial Forge,Basic SMS listening & Supabase sync.
v15.0,Modular Breakout,Decoupled App.js into src/screens.
v19.0,The Sentinel,Added Biometrics & Behavioral Archetypes.
v20.0,Production,Genesis point filtering & Social Ledger.

🛠️ Installation & Build
Clone the Repo: git clone https://github.com/shubhamsitabhwork-arch/Project-Zeus.git

Install: npm install

Launch: npx expo start

Created and Maintained by Shubham Sitabh — Software Architect & Personal Finance Evangelist.
