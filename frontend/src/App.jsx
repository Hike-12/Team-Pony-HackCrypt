import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from "@/pages/Landing";
import {Toaster} from '@/components/ui/sonner';

const App = () => {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App