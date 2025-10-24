import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;