import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface ProductDetail {
  _id: string;
  title: string;
  title_fr: string;
  price: number;
  prixEnPromo?: number;
  discount?: number;
  description_fr: string;
  miniDescription_fr: string;
  images: Array<{
    previewImageSrc: string;
    thumbnailImageSrc: string;
  }>;
  marque: {
    titre: string;
  };
  categorie: {
    titre: string;
  };
  stock: number;
  sku: string;
  mpn: string;
  ratingValue: string;
  reviewCount: string;
}

function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    
    fetch(`/data/products/${slug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h1>
          <Link to="/" className="text-blue-500 hover:underline">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-blue-500 hover:text-blue-700 mb-6"
        >
          ← Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div>
              <div className="space-y-4">
                {product.images && product.images.length > 0 ? (
                  product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.previewImageSrc.replace('https://apibackend.megapc.tn', '/api/images')}
                      alt={`${product.title} - Image ${index + 1}`}
                      className="w-full h-64 object-contain rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = image.previewImageSrc;
                      }}
                    />
                  ))
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title || product.title_fr}
                </h1>
                <div className="space-y-2 mb-4">
                  {product.prixEnPromo ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4">
                        <span className="text-3xl font-bold text-green-600">
                          {product.prixEnPromo} DT
                        </span>
                        <span className="text-xl text-gray-500 line-through">
                          {product.price} DT
                        </span>
                        {product.discount && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                            -{product.discount.toFixed(1)}% OFF
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Stock: {product.stock} units
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl font-bold text-blue-600">
                        {product.price} DT
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock} units
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Brand: {product.marque?.titre}</span>
                  <span>Category: {product.categorie?.titre}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <span>SKU: {product.sku}</span>
                  <span>MPN: {product.mpn}</span>
                </div>
                {product.ratingValue && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-yellow-500">★ {product.ratingValue}</span>
                    <span className="text-sm text-gray-500">
                      ({product.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>

              {/* Mini Description */}
              {product.miniDescription_fr && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Key Features</h3>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.miniDescription_fr }}
                  />
                </div>
              )}

              {/* Full Description */}
              {product.description_fr && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description_fr }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-semibold">
                  Add to Cart
                </button>
                <button className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
                  Add to Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
