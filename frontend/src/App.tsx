import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Landing from './Landing.jsx';
import Analysis from './Analysis';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Landing />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/analysis' element={<Analysis />} />
      </Routes>
    </Router>
  );
}
