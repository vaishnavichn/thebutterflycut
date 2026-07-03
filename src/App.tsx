import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TitleScreen from './components/TitleScreen';
import CaseWorld from './components/CaseWorld';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/case/:caseId" element={<CaseWorld />} />
      </Routes>
    </BrowserRouter>
  );
}
