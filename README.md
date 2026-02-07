# Checksum-Integrity-Hub

A modern web application for verifying file integrity and checksums using AI-powered analysis. Built with React, TypeScript, and Vite for fast development and optimal performance.

## Features

- 🔐 **File Integrity Verification** - Compute and verify file checksums
- 🤖 **AI-Powered Analysis** - Leverage Gemini API for intelligent checksum analysis
- ⚡ **Fast Performance** - Built with Vite for instant hot module replacement
- 📦 **Type Safe** - Full TypeScript support for robust code

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Gemini API key

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Checksum-Integrity-Hub
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
├── App.tsx                 # Main application component
├── index.tsx               # React entry point
├── index.html              # HTML template
├── types.ts                # TypeScript type definitions
├── vite.config.ts          # Vite configuration
├── services/
│   └── geminiService.ts    # Gemini API integration
├── utils/
│   └── hashUtils.ts        # Hash computation utilities
├── package.json            # Project dependencies
└── README.md               # This file
```

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next generation frontend tooling
- **Gemini API** - AI-powered analysis
- **Node.js** - Runtime environment

## License

MIT
