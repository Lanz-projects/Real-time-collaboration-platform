# Real-Time Collaboration App

This is a modern, real-time collaboration application built with React, Vite, and TypeScript. It provides a rich, interactive workspace where users can communicate and work together through video, a shared whiteboard, and synchronized notes.

## ✨ Key Features

*   **Video Conferencing:** High-quality video and audio calls powered by Agora.
*   **Collaborative Whiteboard:** An infinite canvas for drawing and brainstorming, powered by tldraw.
*   **Shared Notes:** A rich-text editor for taking notes that are synchronized in real-time.
*   **Real-time Presence:** See who's online and view their live cursors, powered by Liveblocks.
*   **Screen Sharing:** Share your screen with other participants in the room.
*   **Modern UI:** A sleek and responsive user interface built with shadcn/ui and Tailwind CSS.

## 🚀 Tech Stack

*   **Frontend:** React, Vite, TypeScript
*   **Real-Time Collaboration:**
    *   **Liveblocks:** For real-time whiteboard
    *   **Agora:** For real-time video, audio, screen sharing, notes and room management.
*   **Whiteboard:** tldraw
*   **Styling:** Tailwind CSS, shadcn/ui, Radix UI
*   **Linting & Formatting:** ESLint

## 🏁 Getting Started

Follow these steps to get the development environment up and running.

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   [npm](https://www.npmjs.com/) (comes with Node.js)

### 1. Clone the Repository

```bash
git clone <<the repo>>
cd collaboration-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

This project requires API keys from Liveblocks and Agora.

1.  Create a `.env` file in the root of the project.
2.  Follow the detailed instructions in the **[API Keys Setup Guide](./docs/API_KEYS_SETUP.md)** to get your keys and configure the file.

### 4. Run the Development Server

Once your `.env` file is set up, you can start the application.

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

## 📚 Documentation

*   **[API Keys Setup](./docs/API_KEYS_SETUP.md)** - Required configuration for Liveblocks and Agora API keys

## ♿ Accessibility & Standards

This application follows **W3C HTML5 standards** and **WCAG 2.1 Level AA accessibility guidelines**:

*   ✅ Valid HTML5 structure with proper DOCTYPE and meta tags
*   ✅ Semantic HTML elements (`<main>`, `<header>`, proper heading hierarchy)
*   ✅ Keyboard navigation support for all interactive elements
*   ✅ ARIA labels and roles for screen readers
*   ✅ Skip navigation link for keyboard users
*   ✅ Form autocomplete attributes
*   ✅ Focus indicators on all interactive elements

### HTML Validation

Validate HTML compliance anytime:

```bash
# Validate both source and built HTML
npm run validate:html

# Validate source HTML only
npm run validate:html:src

# Validate built HTML only
npm run validate:html:dist
```

## 🔧 Build Notes

When running `npm run build`, you may see the following warnings. These are **expected and do not indicate problems**:

### Bundle Size Warning
```
(!) Some chunks are larger than 500 kB after minification.
```
- **Why it happens:** The app includes large libraries (Agora RTC/RTM SDKs for video/audio, tldraw for whiteboard, React Quill for rich text editing)
- **Impact:** This is normal for real-time collaboration apps with video conferencing features
- **Solution not required:** The bundle size is acceptable for this application type. Code-splitting could be implemented for optimization but is not necessary for functionality

### Agora SDK Eval Warning
```
Use of eval in "node_modules/agora-rtm-sdk/agora-rtm.js" is strongly discouraged...
```
- **Why it happens:** The Agora RTM SDK uses `eval()` internally for its real-time messaging functionality
- **Impact:** This is part of the official Agora SDK, not your code
- **Solution not required:** This is safe to ignore as it comes from a trusted third-party library