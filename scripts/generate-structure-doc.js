const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORE = ['.git', '.next', 'node_modules', '.turbopack', '.idea', '.vscode', 'dist', 'build', '.gemini', 'package-lock.json', '.prettierrc', 'next-env.d.ts', '.eslintrc.json'];

function getDescription(name, fullPath, isDir) {
  const relPath = path.relative(ROOT, fullPath);
  const parts = relPath.split(path.sep);
  
  if (relPath.startsWith('app')) {
    if (name.includes('page.tsx')) return 'Page implementation component';
    if (name.includes('layout.tsx')) return 'Layout shell for this route';
    if (name.includes('route.ts')) return 'Server-side API route handler';
    if (name.includes('loading.tsx')) return 'Loading UI for this segment';
    if (name.includes('error.tsx')) return 'Error boundary for this segment';
    if (name.startsWith('(')) return 'Route Group (logical separation)';
    if (isDir) return 'Route segment directory';
  }

  if (relPath.startsWith('features')) {
    if (parts.length === 2 && isDir) return 'Feature Bounded Context: ' + name.toUpperCase();
    if (name === 'api') return 'Feature data access layer';
    if (name === 'components') return 'Feature-specific UI components';
    if (name === 'hooks') return 'Feature business logic hooks';
    if (name === 'store') return 'Feature state management (Zustand)';
    if (name === 'types') return 'Feature domain type definitions';
    if (name === 'mappers') return 'Feature DTO transformation logic';
    if (name === 'index.ts') return 'Feature Public API Gateway';
  }

  if (relPath.startsWith('lib')) {
    if (name === 'http') return 'HTTP transport & client configuration';
    if (name === 'auth') return 'Security & Identity management core';
    if (name === 'errors') return 'Standardized error hierarchy (AppError)';
    if (name === 'observability') return 'Logging, Tracing & Monitoring';
    if (name === 'query') return 'TanStack Query infrastructure';
  }

  if (relPath.startsWith('shared')) {
    if (name === 'hooks') return 'Shared domain hooks (multi-feature)';
    if (name === 'components') return 'Shared domain UI components';
    if (name === 'utils') return 'Shared domain business logic';
  }

  if (isDir) return 'Sub-directory';
  return 'Source implementation file';
}

function traverse(dir, prefix = '', isLast = true) {
  const files = fs.readdirSync(dir).filter(f => !IGNORE.includes(f)).sort();
  let lines = [];

  files.forEach((file, index) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    const isDir = stat.isDirectory();
    const lastItem = index === files.length - 1;
    
    const treeSymbol = lastItem ? '└── ' : '├── ';
    const treePart = prefix + treeSymbol + file;
    const desc = getDescription(file, fullPath, isDir);
    
    lines.push({ tree: treePart, desc: desc });
    
    if (isDir) {
      const newPrefix = prefix + (lastItem ? '    ' : '│   ');
      lines = lines.concat(traverse(fullPath, newPrefix, lastItem));
    }
  });

  return lines;
}

const header = `# Enterprise Architectural Blueprint: Definitive Technical Map

This document is the **Ultimate Source of Truth** for the E-Shop Enterprise workspace. It meticulously documents every layer of the infrastructure, configuration files, and build artifacts, ensuring total architectural transparency.

## 🏗️ Architectural Overview

The project follows a **Feature-First Bounded Context** architecture (Modular Monolith).

## 🏛️ Layer Matrix Enforcement [HARDEN]

| Layer | Allowed Imports | Responsibility |
| :--- | :--- | :--- |
| **app** | features, shared, lib | Routing, Page composition, Global providers |
| **features** | shared, lib | Bounded contexts, Business UI, Feature-state |
| **shared** | lib | Cross-domain UI components, Global hooks |
| **lib** | lib (internal) | Infrastructure, API clients, Low-level utils |
| **ui** | nothing | Primitive, stateless UI components (Shadcn) |

## 📜 Layer Responsibilities

### 1. The Feature Layer (/features)
Each feature folder is a **Bounded Context** that encapsulates a specific business domain.

### 2. The Shared Layer (/shared)
Business-logic-aware primitives shared across features.

### 3. The Infrastructure Layer (/lib)
Stateless utilities, core service configurations, and external integrations.

---

## 🗺️ Architectural Roadmap [FUTURE]

| Goal | Description | Status |
| :--- | :--- | :--- |
| **Typed SDK Generation** | Switch to Orval for automatic React Query hook generation from OpenAPI. | Planned |
| **Infrastructure Split** | Sub-divide \`lib/\` into \`infra/\`, \`platform/\`, and \`core/\`. | Planned |
| **Contract Testing** | Implement PACT or similar for consumer-driven contract testing. | Researching |
| **Performance Gates** | Block CI if Lighthouse or BundleSize budgets are exceeded. | Active |

---

## 📂 Exhaustive Project Tree

\`\`\`text
`;

const footer = '\n```\n';

const rawLines = traverse(ROOT);
const maxTreeWidth = Math.max(...rawLines.map(l => l.tree.length));
const alignedLines = rawLines.map(l => l.tree.padEnd(maxTreeWidth + 2) + '# ' + l.desc).join('\n');

fs.writeFileSync('docs/blueprint/STRUCTURE.md', header + alignedLines + footer);
console.log('STRUCTURE.md updated with properly aligned exhaustive detail and tree lines.');
