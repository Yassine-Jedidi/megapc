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
  category?: string;
  subcategory?: string;
}

function ProductList() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('price-low');
  const productsPerPage = 20;

  useEffect(() => {
    fetch('/data/light-index.json')
      .then((res) => res.json())
      .then((data) => {
        setAllProducts(data);
        setFilteredProducts(data);
      });
  }, []);

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)))];

  // Get subcategories for selected category
  const getSubcategories = () => {
    if (selectedCategory === 'All') {
      return ['All'];
    }
    const categoryProducts = allProducts.filter(p => p.category === selectedCategory);
    return ['All', ...Array.from(new Set(categoryProducts.map(p => p.subcategory).filter(Boolean)))];
  };

  const subcategories = getSubcategories();

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategory('All');
  }, [selectedCategory]);

  // Sort products function
  const sortProducts = (products: Product[]) => {
    const sorted = [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'name-a-z':
          return a.title.localeCompare(b.title);
        case 'name-z-a':
          return b.title.localeCompare(a.title);
        case 'discount-high':
          return (b.discount || 0) - (a.discount || 0);
        default:
          return 0;
      }
    });
    return sorted;
  };

  // Filter products by category, subcategory and search
  useEffect(() => {
    let filtered = allProducts;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter(product => product.subcategory === selectedSubcategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subcategory?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort the filtered products
    const sortedFiltered = sortProducts(filtered);
    setFilteredProducts(sortedFiltered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [selectedCategory, selectedSubcategory, searchQuery, sortBy, allProducts]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Products</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-4">
            Page {currentPage} of {totalPages} • Showing {currentProducts.length} of {filteredProducts.length} products
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col xl:flex-row gap-4 justify-center items-center">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 lg:w-96 pl-12 pr-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-6 py-3 pr-10 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'All' ? '🏠 All Categories' : `📦 ${category}`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Subcategory Filter */}
            <div className="relative">
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-6 py-3 pr-10 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
                disabled={selectedCategory === 'All'}
              >
                {subcategories.map((subcategory) => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory === 'All' ? '🔍 All Subcategories' : `🏷️ ${subcategory}`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-6 py-3 pr-10 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
              >
                <option value="price-low">💰 Price: Low to High</option>
                <option value="price-high">💰 Price: High to Low</option>
                <option value="name-a-z">📝 Name: A to Z</option>
                <option value="name-z-a">📝 Name: Z to A</option>
                <option value="discount-high">🔥 Best Discounts</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {(searchQuery || selectedCategory !== 'All' || selectedSubcategory !== 'All' || sortBy !== 'price-low') && (
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">
                {searchQuery && (
                  <span>
                    🔍 Searching for "<span className="font-semibold text-blue-600">{searchQuery}</span>"
                  </span>
                )}
                {searchQuery && (selectedCategory !== 'All' || selectedSubcategory !== 'All' || sortBy !== 'price-low') && (
                  <span className="mx-2">•</span>
                )}
                {selectedCategory !== 'All' && (
                  <span>
                    📦 In category "<span className="font-semibold text-purple-600">{selectedCategory}</span>"
                  </span>
                )}
                {selectedCategory !== 'All' && selectedSubcategory !== 'All' && (
                  <span className="mx-2">•</span>
                )}
                {selectedSubcategory !== 'All' && (
                  <span>
                    🏷️ In subcategory "<span className="font-semibold text-green-600">{selectedSubcategory}</span>"
                  </span>
                )}
                {sortBy !== 'price-low' && (
                  <span>
                    {sortBy === 'price-high' && '💰 Sorted by: Price High to Low'}
                    {sortBy === 'name-a-z' && '📝 Sorted by: Name A to Z'}
                    {sortBy === 'name-z-a' && '📝 Sorted by: Name Z to A'}
                    {sortBy === 'discount-high' && '🔥 Sorted by: Best Discounts'}
                  </span>
                )}
                <span className="ml-2">
                  ({filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''})
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {currentProducts.map((product) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-16 space-x-2">
            {/* Previous Button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
              }`}
            >
              ← Previous
            </button>

            {/* Page Numbers */}
            <div className="flex space-x-2">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => goToPage(1)}
                    className="px-4 py-2 rounded-xl font-semibold bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 py-2 text-gray-400">...</span>
                  )}
                </>
              )}

              {/* Page numbers around current page */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl'
                        : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 shadow-lg'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 py-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => goToPage(totalPages)}
                    className="px-4 py-2 rounded-xl font-semibold bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
              }`}
            >
              Next →
            </button>
          </div>
        )}

        {/* Enhanced Empty State */}
        {currentProducts.length === 0 && allProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6 animate-bounce">🛍️</div>
            <h3 className="text-3xl font-bold text-gray-700 mb-4">Loading Premium Products...</h3>
            <p className="text-xl text-gray-500 mb-8">Please wait while we fetch the latest deals</p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        )}

        {/* No Products Found for Category */}
        {currentProducts.length === 0 && allProducts.length > 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-3xl font-bold text-gray-700 mb-4">No products found</h3>
            <p className="text-xl text-gray-500 mb-8">
              No products available in the "{selectedCategory}" category
            </p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              🏠 View All Categories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;
