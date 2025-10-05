# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

TRAVELOO is an advanced, collaborative travel expense planning and management platform. It streamlines group trip budgeting, expense prediction, cost-sharing, and user flows through an intuitive web interface. The backend is implemented with Laravel 12 for robust, scalable APIs and business logic, while the frontend leverages React Flow and TypeScript to design visual, interactive user journeys and collaborative decision making.
## Development Commands

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run build:ssr` - Build with SSR support
- `npm run lint` - Run ESLint with fixes
- `npm run types` - TypeScript type checking (no emit)
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes

**Backend:**
- `composer dev` - Start full development environment (server, queue, logs, vite)
- `composer dev:ssr` - Start development with SSR
- `composer test` - Run PHPUnit tests
- `php artisan serve` - Start Laravel development server
- `php artisan queue:listen --tries=1` - Process queue jobs
- `php artisan pail --timeout=0` - Real-time log monitoring

**Testing:**
- `php artisan test` - Run Laravel tests
- Individual test: `php artisan test --filter TestName`

## Application Architecture

This is a Laravel + React travel planning application with a sophisticated flow-based interface for creating travel planners.

### Backend Structure

**Core Models:**
- `Planner` - Main travel planner entity with UUID primary keys
- `PlannerNode` - Individual nodes in the flow (flights, bookings, groups)
- `PlannerEdge` - Connections between nodes
- `PlannerCollaborator` - Collaboration system with permissions
- `PlannerFork` - Fork/branch system for planners

**Key Features:**
- **Collaboration System**: Users can invite collaborators with view/edit permissions
- **Fork System**: Create forks of planners for experimentation
- **Public Sharing**: Planners can be made public with share tokens
- **Permission System**: Owner/edit/view permissions with proper access control

### Frontend Architecture

**State Management:**
- **Zustand Store** (`resources/js/app/store/flowStore.ts`) - Main flow state with persistence
- **Auto-save System** - Debounced auto-save with conflict resolution
- **Undo/Redo** - History management with snapshots
- **Modal System** - Centralized node editing modals

**Flow System:**
- **React Flow** - Core flow visualization using `@xyflow/react`
- **Node Types**: BookingNode, FlightNode, GroupNode
- **Drag and Drop** - Node creation from sidebar
- **Real-time Sync** - Auto-save to backend via Inertia

**UI Framework:**
- **React 19** with TypeScript
- **Tailwind CSS 4** with custom component system
- **Radix UI** components for accessible primitives
- **Inertia.js** for SPA-like experience with Laravel

### Key Development Patterns

**Flow State Management:**
- Use `useFlowStore` hooks for state access
- Separate concerns: `useFlowOperations`, `useModalOperations`, `useNodeOperations`
- Auto-save triggered on significant changes (node add/remove/position)
- History snapshots for undo/redo functionality

**Node System:**
- Nodes are TypeScript interfaces with consistent data structure
- Node settings managed through centralized modal system
- Canvas updates vs immediate saves (different strategies)

**Backend Integration:**
- Inertia-based saving via `planners.save-flow` route
- CSRF handled automatically through Inertia
- Real-time sync status in UI

**Slice Architecture:**
- Travel-specific components in `resources/js/slices/travel/`
- Shared components in `resources/js/shared/`
- Configurable flow system supporting different "slices"

### Database Considerations

- Uses UUIDs for primary keys on core models
- Postgres in development, supports other databases
- Migrations handle complex relationships (collaborators, forks)
- Soft deletes not implemented - uses hard deletes

### Testing Approach

- PHPUnit for backend tests
- Feature tests for authentication and main flows
- Unit tests for individual components
- Tests use SQLite in-memory database
