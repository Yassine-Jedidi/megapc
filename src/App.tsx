import { useEffect, useState } from 'react';
import './index.css'

interface Product {
  slug: string;
  id: string;
  title: string;
  price: number;
  img: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/light-index.json')
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Product Catalog</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition-shadow"
          >
            <img
              src={product.img.replace('https://apibackend.megapc.tn', '/api/images')}
              alt={product.title}
              className="w-32 h-32 object-contain mb-4 rounded"
              loading="lazy"
              onError={(e) => {
                console.error('Image failed to load:', product.img);
                // Fallback to original URL
                e.currentTarget.src = product.img;
              }}
            />
            <h2 className="font-semibold text-lg text-center mb-2 line-clamp-2">{product.title}</h2>
            <div className="text-blue-600 font-bold text-xl mb-2">{product.price} DT</div>
            <a
              href={`#${product.slug}`}
              className="mt-auto inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Voir le produit
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App
