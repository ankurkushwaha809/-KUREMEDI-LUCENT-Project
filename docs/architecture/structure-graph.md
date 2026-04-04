# Lucent App Structure Graph

This document provides a high-level file/folder graph for the workspace.

## Folder Tree (High Level)

```text
lucent-app/
|-- backend/
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- model/
|   |-- routes/
|   |-- scripts/
|   |-- uploads/
|   |-- utils/
|   |-- index.js
|   |-- package.json
|   |-- SUPPORT_CHAT.md
|   `-- FIX-413-KYC.md
|
|-- Frontend/
|   |-- website/
|   |   |-- public/
|   |   |-- src/
|   |   |   |-- app/
|   |   |   |-- api/
|   |   |   |-- components/
|   |   |   |-- context/
|   |   |   |-- utils/
|   |   |   `-- config.js
|   |   |-- package.json
|   |   `-- README.md
|   |
|   |-- admin/
|   |   |-- public/
|   |   |-- src/
|   |   |-- package.json
|   |   `-- vite.config.js
|   |
|   |-- app/
|   |   |-- app/
|   |   |-- assets/
|   |   |-- components/
|   |   `-- package.json
|   |
|   `-- mrapp/
|       |-- app/
|       |-- assets/
|       |-- components/
|       `-- package.json
|
|-- docs/
|   `-- architecture/
|       `-- structure-graph.md
|
|-- README.md
`-- package.json
```

## Mermaid Graph

```mermaid
graph TD
    A[lucent-app]

    A --> B[backend]
    B --> B1[config]
    B --> B2[controllers]
    B --> B3[middleware]
    B --> B4[model]
    B --> B5[routes]
    B --> B6[utils]
    B --> B7[uploads]
    B --> B8[index.js]
    B --> B9[package.json]

    A --> C[Frontend]

    C --> C1[website]
    C1 --> C11[src]
    C11 --> C111[app]
    C11 --> C112[api]
    C11 --> C113[components]
    C11 --> C114[context]
    C11 --> C115[utils]
    C1 --> C12[public]
    C1 --> C13[package.json]

    C --> C2[admin]
    C2 --> C21[src]
    C2 --> C22[public]
    C2 --> C23[package.json]

    C --> C3[app-mobile]
    C3 --> C31[app]
    C3 --> C32[assets]
    C3 --> C33[components]

    C --> C4[mrapp-mobile]
    C4 --> C41[app]
    C4 --> C42[assets]
    C4 --> C43[components]

    A --> D[docs]
    D --> D1[architecture]
    D1 --> D2[structure-graph.md]
```

## Notes

- This is a high-level architecture map for quick navigation.
- If you want, this can be extended to include every nested file automatically from the current workspace state.
