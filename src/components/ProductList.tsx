import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Product {
  slug: string;
  id: string;
  title: string;
  price: number;
  img: string;
  prixEnPromo?: number;
  discount?: number;
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/data/light-index.json')
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Products</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100/50 backdrop-blur-sm"
            >
             

              {/* Discount Badge */}
              {product.prixEnPromo && product.discount && (
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-bounce">
                    -{product.discount.toFixed(0)}% OFF
                  </div>
                </div>
              )}

              {/* Image Container */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 h-64">
                <img
                  src={product.img.replace('https://apibackend.megapc.tn', '/api/images')}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 p-6"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Image failed to load:', product.img);
                    e.currentTarget.src = product.img;
                  }}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Quick View Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <Link
                    to={`/product/${product.slug}`}
                    className="bg-white/90 backdrop-blur-sm text-gray-800 px-8 py-3 rounded-full font-bold shadow-2xl hover:bg-white hover:scale-105 transition-all duration-300 transform"
                  >
                    👁️ Quick View
                  </Link>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <h2 className="font-bold text-lg text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                  {product.title}
                </h2>
                
                {/* Enhanced Pricing */}
                <div className="mb-6">
                  {product.prixEnPromo ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            {product.prixEnPromo} DT
                          </span>
                          <span className="text-lg text-gray-400 line-through font-medium">
                            {product.price} DT
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          💰 Save {product.price - product.prixEnPromo} DT
                        </div>
                        <div className="text-xs text-gray-500">
                          Limited Time Offer
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {product.price} DT
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    to={`/product/${product.slug}`}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-4 px-6 rounded-2xl font-bold text-center block hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                  >
                    🛒 View Details
                  </Link>
                  <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105">
                    ❤️ Add to Wishlist
                  </button>
                </div>
              </div>

              {/* Bottom Gradient Border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {products.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6 animate-bounce">🛍️</div>
            <h3 className="text-3xl font-bold text-gray-700 mb-4">Loading Premium Products...</h3>
            <p className="text-xl text-gray-500 mb-8">Please wait while we fetch the latest deals</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        {products.length > 0 && (
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h3>
              <p className="text-blue-100 mb-6">Contact our experts for personalized recommendations</p>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors duration-300">
                💬 Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
