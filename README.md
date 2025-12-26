# AnimSVG

**Create stunning animated SVGs with AI-powered generation**

---

## ✨ Features

- 🤖 **AI-Powered Generation** — Describe animations in natural language, powered by Gemini 3.0 Pro
- 🎨 **Live SVG Preview** — Real-time preview with zoom, grid, and fullscreen controls
- 🎬 **Export to GIF/MP4** — Export your animations as GIF or MP4 video
- 🎨 **Color Editor** — Extract and modify colors directly from the SVG
- 📝 **Code Editor** — Edit SVG code with syntax highlighting
- 📜 **Version History** — Undo/redo and browse through all versions
- 🌙 **Dark Mode** — Beautiful light and dark themes

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd animsvg
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
animsvg/
├── src/
│   ├── components/       # React components
│   │   ├── Button.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── EditorPanel.tsx
│   │   ├── GifExportModal.tsx
│   │   ├── Header.tsx
│   │   └── SvgPreview.tsx
│   ├── services/         # API and utility services
│   │   ├── geminiService.ts
│   │   ├── gifService.ts
│   │   └── videoService.ts
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   ├── types.ts          # TypeScript type definitions
│   ├── index.css         # Global styles with Tailwind
│   └── vite-env.d.ts     # Vite environment types
├── index.html            # HTML entry point
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## 🛠️ Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `pnpm dev`     | Start development server |
| `pnpm build`   | Build for production     |
| `pnpm preview` | Preview production build |

## 🔧 Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript 5.8
- **AI:** Google Gemini 3.0 Pro
- **Icons:** Lucide React
- **Video Export:** mp4-muxer, gifenc
