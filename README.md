# Wisecore Frontend

**Version 0.4**

Wisecore is an advanced platform powered by Large Language Models (LLMs) designed to help organizations generate, manage, and share internal knowledge efficiently. This repository contains the frontend application built with React, TypeScript, and modern web technologies.

## Overview

Wisecore centralizes your company's information, automates documentation, and empowers your teams with instant access to reliable, AI-driven insights. The platform provides a comprehensive suite of tools for knowledge management, document generation, and intelligent search capabilities.

## Key Features

### 🏠 **Home Dashboard**
- Welcome page with platform overview
- Quick access to main features
- Feature highlights with automated documentation, intelligent search, team collaboration, and AI insights

### 📚 **Library**
- Centralized document repository
- Hierarchical folder structure
- Document organization and management
- File browsing with breadcrumb navigation

### 🔍 **Smart Search**
- Intelligent search across all organizational knowledge
- Multiple search modes (normal and advanced)
- Content-aware search results
- Quick access to relevant documents and sections

### 📝 **Templates**
- Document template creation and management
- Template-based document generation
- Reusable content structures
- Template configuration and customization

### 📄 **Documents**
- Document creation from templates
- Document type filtering
- Rich document editor with MDX support
- Document execution and processing
- Dependency management between documents

### 🌐 **Network Visualization**
- Interactive graph view of document relationships
- Visual representation of dependencies
- Network analysis of knowledge connections

### 🏢 **Organizations**
- Multi-organization support
- Organization selection and switching
- Scoped content per organization

### 🤖 **AI Chatbot**
- Integrated AI assistant
- Context-aware conversations
- Document-specific assistance
- Expandable chat interface

## Technical Stack

### Frontend Framework
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server

### UI Components
- **Shadcn/UI** - Modern component library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible primitive components
- **Lucide Icons** - Beautiful icon set

### State Management & Data Fetching
- **TanStack Query** - Powerful data synchronization
- **React Router Dom** - Client-side routing
- **React Context** - Organization state management

### Rich Text Editing
- **MDX Editor** - Advanced markdown editing
- **React Markdown** - Markdown rendering
- **Remark & Rehype** - Markdown processing plugins

### Developer Experience
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Hot Module Replacement** - Fast development

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/UI components
│   ├── chatbot/        # AI chatbot components
│   └── library/        # Library-specific components
├── pages/              # Main application pages
├── services/           # API service layers
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── lib/                # Utility functions
└── assets/             # Static assets
```

## Main Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/home` | Home | Landing page with platform overview |
| `/library` | Library | Document repository and file browser |
| `/search` | SearchPage | Intelligent search interface |
| `/templates` | Templates | Template management |
| `/documents` | Documents | Document listing and filtering |
| `/organizations` | Organizations | Organization management |
| `/graph` | Graph | Network visualization of documents |
| `/configTemplate/:id` | ConfigTemplate | Template configuration |
| `/document/:id` | DocumentPage | Document viewer/editor |
| `/configDocument/:id` | ConfigDocumentPage | Document configuration |
| `/execution/:id` | ExecutionPage | Document execution details |
| `/docDepend/:id` | DocDependPage | Document dependencies |

## Core Components

### Layout Components
- **Layout** - Main application layout with sidebar
- **Sidebar** - Navigation sidebar with organization selector
- **OrganizationSelector** - Organization switching component

### Document Components
- **Document** - Document display component
- **Editor** - Rich text editor with MDX support
- **Template** - Template display and management
- **SectionExecution** - Document section processing
- **ExecutionInfo** - Execution status and details

### Search & Discovery
- **SearchResult** - Search result display
- **NetworkGraph** - Interactive relationship visualization
- **TableOfContents** - Document navigation

### Content Management
- **CreateDocument** - Document creation workflow
- **CreateFolder** - Folder creation
- **AddDocumentSection** - Section management
- **SortableSection** - Drag-and-drop section ordering

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/HuemulSolutions/wisecore-front.git
cd wisecore-front
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Configuration

The application uses environment-based configuration through `src/config.ts`. Make sure to configure your API endpoints and other environment-specific settings.

## Contributing

1. Follow the coding standards defined in the project
2. Use TypeScript for all new code
3. Implement proper error handling
4. Add proper component documentation
5. Test your changes thoroughly

## Architecture Highlights

- **Component-based architecture** with clear separation of concerns
- **Service layer abstraction** for API interactions
- **Responsive design** with mobile-first approach
- **Accessibility** compliance with ARIA standards
- **Performance optimization** with code splitting and lazy loading
- **Type safety** throughout the application

## License
WiseCore is licensed under the **Elastic License 2.0**.

### What does this mean?

- ✅ **Free to use** for personal and commercial purposes
- ✅ **Modify and distribute** the code
- ✅ **Use internally** in your business without restrictions
- ❌ **Cannot offer as SaaS** or managed service
- ❌ **Cannot resell** the software as a product
- ❌ **Cannot sell consulting services** primarily based on WiseCore

For more details, see:
- [![License](https://img.shields.io/badge/License-Elastic%202.0-blue.svg)](LICENSE.md) - Full legal terms
- [![Notice](https://img.shields.io/badge/Read-NOTICE-orange.svg)](NOTICE.md) - Plain language explanation


---

**Wisecore Frontend v0.4** - Empowering organizations with AI-driven knowledge management.
