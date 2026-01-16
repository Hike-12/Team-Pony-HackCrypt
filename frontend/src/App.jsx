import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from "@/pages/Landing";
import NotFound from "@/pages/NotFound";
import {Toaster} from '@/components/ui/sonner';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App