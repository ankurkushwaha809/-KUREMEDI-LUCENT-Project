import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import { ContextProvider } from './context/context.jsx'
import { AppSidebar } from './components/app-sidebar.jsx'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ContextProvider>
    <BrowserRouter>
        <main>

          <App />
        </main>
     

    </BrowserRouter>
    </ContextProvider>
  </StrictMode>
)
