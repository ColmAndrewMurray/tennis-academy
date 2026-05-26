import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BookingPage from './pages/BookingPage';
import SuccessPage from './pages/SuccessPage';
import CancelPage  from './pages/CancelPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<BookingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel"  element={<CancelPage  />} />
        <Route path="*"        element={<BookingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
