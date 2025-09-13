# Windows Server Management Application

## Overview

This is a comprehensive Windows Server management console built with React and Express.js, designed for enterprise administrators to manage Windows Server infrastructure through a web interface. The application provides tools for Active Directory (AD), Active Directory Certificate Services (ADCS), and DNS management via remote PowerShell execution. It features real-time task monitoring, server connection management, and a modern enterprise-grade UI following Microsoft Fluent Design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom design system following Microsoft Fluent Design principles
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with real-time capabilities via Socket.IO
- **Database ORM**: Drizzle ORM for type-safe database operations
- **PowerShell Execution**: Custom PowerShell executor service for remote Windows management
- **Real-time Communication**: Socket.IO for streaming PowerShell output and task updates

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Encryption**: Built-in credential encryption for storing server connection passwords
- **Session Storage**: PostgreSQL-backed session storage using connect-pg-simple

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: Encrypted credential storage for server connections
- **Access Control**: Role-based access through server connection configurations

### Design System
- **Color Scheme**: Dark/light mode support with enterprise-focused neutral palette
- **Typography**: Segoe UI font family for Windows consistency
- **Components**: Comprehensive UI component library with hover states, elevations, and Microsoft Fluent Design patterns
- **Responsive Design**: Mobile-first approach with collapsible sidebar navigation

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting for primary data storage
- **Drizzle ORM**: Type-safe database operations and migration management

### UI and Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe component variant management

### Development and Build Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type checking and development experience
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS**: CSS processing and optimization

### Real-time Communication
- **Socket.IO**: WebSocket library for real-time PowerShell output streaming
- **TanStack Query**: Server state management and caching

### PowerShell Integration
- **Child Process**: Node.js native module for PowerShell execution
- **WinRM Protocol**: Remote management protocol for Windows servers (planned)

### Form Management
- **React Hook Form**: Performant form handling
- **Zod**: Runtime type validation and schema definition
- **Hookform Resolvers**: Integration between React Hook Form and Zod