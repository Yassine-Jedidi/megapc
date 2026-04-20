export interface Category {
  id: string;
  name: string;
  _count: {
    products: number;
  };
}

export interface PriceHistory {
  id: string;
  price: number;
  productId: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  salePrice: number | null;
  onSale: boolean;
  isNew: boolean;
  stock: number;
  images: string[];
  category?: { 
    id: string;
    name: string; 
  };
  subCategory?: {
    id: string;
    name: string;
  };
  description?: string;
  cpu?: string;
  gpu?: string;
  commande48H?: boolean;
  quoteMode?: boolean;
  checkStock?: boolean;
  isPrivate?: boolean;
  isArriving?: boolean;
  viewCount?: number;
  priceHistory?: PriceHistory[];
  createdAt?: string;
  updatedAt?: string;
  siteCreateDate?: string;
  siteUpdateDate?: string;
}

export interface ProductDetailsProps {
  onNavigate: (categoryId: string | null, subCategoryId: string | null) => void;
  addToCart: (product: Product) => void;
}
