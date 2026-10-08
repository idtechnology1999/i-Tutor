import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/registration.css'
import './styles/site.css'
import './styles/previews.css'
import './styles/motion.css'
import './styles/app.css'
import './styles/exam-tools.css'
import './styles/exam-start.css'
import './styles/exam-desktop.css'
import './styles/ask-ai.css'
import './styles/news.css'
import './styles/admin.css'
import './styles/courses.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
