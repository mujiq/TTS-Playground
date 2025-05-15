Prompt for Web User Interface Development:
Objective: Design and build a modern, intuitive, and responsive web user interface (UI) for the TextToSpeech Playground platform, allowing users to interact with its text-to-voice and avatar selection functionalities, and to visualize system monitoring data.
Target Audience: End-users who need to generate voice files from text with specific language and avatar preferences, and potentially system administrators who need to monitor the platform's performance.
Key Features to Implement:
Text Input Area:
A clear and spacious text area where users can paste or type the text they want to convert to speech.
Support for large text inputs.
Basic text editing capabilities (optional: clear, undo/redo).
Language Selection:
A user-friendly dropdown or selectable list of supported languages (English, Arabic, Spanish, Hindi/Urdu, etc.).
Visually distinct and easily identifiable language options.
Avatar Selection:
A section to choose an avatar.
Clear visual representation of available avatars (e.g., icons or representative images for male, female).
For English and Arabic, a sub-selection mechanism (e.g., another dropdown or radio buttons) to choose the desired dialect (e.g., en-US, en-GB, ar-SA, ar-EG).
Intuitive labeling for each avatar and dialect.
Voice Generation Controls:
A prominent "Generate Voice" button.
Visual feedback during the voice generation process (e.g., loading spinner, progress bar - if feasible).
A clear indication upon successful voice file generation.
Audio Playback:
An embedded audio player to directly play the generated voice file within the browser.
Standard audio controls (play, pause, volume).
Download Option:
A clear and easy-to-find button or link to download the generated voice file in .mp3 format.
Informative feedback upon successful download.
Automated Content Generation Interface (Admin/Advanced User Section - Potentially a Separate View):
A section to manage or trigger the automated voice generation for the 100 hospitality social media posts.
Clear indication of the status of the batch generation process.
Potentially options to filter or view the generated files based on post number, language, and dialect.
System Monitoring Dashboard (Admin/Advanced User Section - Separate View):
A real-time dashboard displaying key system metrics:
CPU Usage (visualized per core and overall).
Memory Usage (RAM and swap, with clear indicators of used and available).
Disk I/O and Usage (read/write speeds, used/total space).
Network Throughput (incoming and outgoing bandwidth).
GPU Usage (for each GPU): Utilization percentage, memory usage, temperature (if available), power consumption (if available).
Clear and informative charts or graphs for each metric.
Real-time updates of the monitoring data.
Potentially a log viewer or link to more detailed logs.
Visual cues or alerts for high resource utilization (e.g., color changes when exceeding thresholds).
Display of the number of audio files currently being generated.
User Experience (UX) Considerations:
Intuitive Navigation: Easy to understand and navigate between different sections of the UI.
Clear Visual Hierarchy: Important elements should be visually prominent.
Responsiveness: The UI should adapt seamlessly to different screen sizes (desktop, tablet, mobile).
Accessibility: Adhere to accessibility guidelines (WCAG) to ensure usability for all users.
Modern and Clean Design: Employ a contemporary and visually appealing design aesthetic.
Feedback Mechanisms: Provide clear and timely feedback to user actions.
State-of-the-Art Web UI Stack:
Frontend Framework: React (for its component-based architecture, large ecosystem, performance, and strong community) or Vue.js (for its progressive nature, ease of use, and performance). Consider Next.js (for React) or Nuxt.js (for Vue.js) for server-side rendering (SSR) or static site generation (SSG) if SEO or initial load performance is critical (though less crucial for an internal tool).
State Management:
React: Redux Toolkit (for structured and predictable state management), Recoil (for a more atomic and simpler approach), or Zustand (for a minimal and fast option). Context API with useReducer for simpler state needs.
Vue.js: Vuex (the official state management library) or Pinia (the recommended next-generation state management solution).
UI Component Library:
Material UI (MUI): Provides a comprehensive set of React components following Material Design principles.
Chakra UI: A simple, modular, and accessible component library for React.
Ant Design: A feature-rich UI design language and React component library.
Tailwind CSS: A utility-first CSS framework that can be combined with headless UI libraries like Headless UI or Radix UI for highly customizable components.
Styling:
CSS Modules (for component-level styling).
Styled Components (for CSS-in-JS).
Tailwind CSS (utility-first).
Data Fetching:
React: fetch API with libraries like swr or react-query for efficient data fetching and caching.
Vue.js: fetch API or libraries like axios.
Charting Library (for Monitoring Dashboard):
Chart.js: Simple and widely used.
Recharts: A composable charting library for React.
Nivo: A rich set of data visualization components for React.
ApexCharts: Versatile charting library supporting various chart types.
Real-time Data (for Monitoring - Optional but Recommended):
WebSockets: For bidirectional communication to push real-time monitoring data to the UI.
Server-Sent Events (SSE): For unidirectional real-time updates from the server.
Build Tools:
Webpack or Vite for bundling and development server.
Testing:
Jest and React Testing Library (for React) or Vitest and Vue Test Utils (for Vue.js) for unit and integration testing.
Cypress or Playwright for end-to-end testing.
Technical Considerations for Integration:
The UI needs to communicate with the backend REST API to send text, language, and avatar selections and receive the generated audio file URL or data.
The monitoring dashboard needs to fetch real-time system metrics from the backend (potentially a dedicated monitoring API endpoint or via WebSockets/SSE).
Deliverables:
A fully functional and responsive web UI.
Well-organized and maintainable codebase.
Component-based architecture.
Clear documentation for the UI components and functionality.
Unit and integration tests for critical UI components.
