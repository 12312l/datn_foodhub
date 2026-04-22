import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Minus, Plus, ArrowLeft, ChevronLeft, ChevronRight, Heart, Zap } from 'lucide-react';
import { productAPI, reviewAPI, favoriteAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/user/Toast';
import { Product, Review, ProductImage, ProductVariant } from '../../types';
import { jwtDecode } from 'jwt-decode';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    loadProduct();
  }, [id, isAuthenticated]);

  // const loadProduct = async () => {
  //   setIsLoading(true);
  //   try {
  //     const [productRes, reviewsRes] = await Promise.all([
  //       productAPI.getById(parseInt(id!)),
  //       reviewAPI.getByProduct(parseInt(id!), { page: 0, size: 10 }),
  //     ]);
  //     setProduct(productRes.data);
  //     setReviews(reviewsRes.data.content);

  //     if (productRes.data.variants && productRes.data.variants.length > 0) {
  //       const defaultIndex = productRes.data.variants.findIndex((v: ProductVariant) => v.isDefault);
  //       setSelectedVariantIndex(defaultIndex >= 0 ? defaultIndex : 0);
  //     }

  //     // Check if product is favorite
  //     if (isAuthenticated) {
  //       try {
  //         const favRes = await favoriteAPI.check(parseInt(id!));
  //         setIsFavorite(favRes.data);
  //       } catch (e) {
  //         // User not logged in or error
  //       }
  //     }

  //     // Load related products
  //     if (productRes.data.categoryId) {
  //       const relatedRes = await productAPI.getByCategory(productRes.data.categoryId, { page: 0, size: 4 });
  //       setRelatedProducts(relatedRes.data.content.filter((p: Product) => p.id !== parseInt(id!)));
  //     }
  //   } catch (error) {
  //     console.error('Error loading product:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy userId từ Token trước khi gọi API
      const token = localStorage.getItem('token');
      let userId: number | null = null;
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          userId = decoded.id; // Lấy ID từ token mới bạn đã sửa ở Backend
        } catch (e) {
          console.error("Token decode error:", e);
        }
      }

      // 2. Truyền userId vào getById để Backend lưu vào bảng recently_viewed
      const [productRes, reviewsRes] = await Promise.all([
        productAPI.getById(parseInt(id!), userId || undefined), // userId truyền vào đây
        reviewAPI.getByProduct(parseInt(id!), { page: 0, size: 10 }),
      ]);

      setProduct(productRes.data);
      setReviews(reviewsRes.data.content);

      if (productRes.data.variants && productRes.data.variants.length > 0) {
        const defaultIndex = productRes.data.variants.findIndex((v: ProductVariant) => v.isDefault);
        setSelectedVariantIndex(defaultIndex >= 0 ? defaultIndex : 0);
      }

      // Check if product is favorite
      if (isAuthenticated) {
        try {
          const favRes = await favoriteAPI.check(parseInt(id!));
          setIsFavorite(favRes.data);
        } catch (e) {}
      }

      // Load related products
      if (productRes.data.categoryId) {
        const relatedRes = await productAPI.getByCategory(productRes.data.categoryId, { page: 0, size: 4 });
        setRelatedProducts(relatedRes.data.content.filter((p: Product) => p.id !== parseInt(id!)));
      }
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddToCart = async () => {
    if (product) {
      const selectedVariant = product.variants?.[selectedVariantIndex];
      const effectivePrice = selectedVariant?.salePrice || product.price;
      await addItem(product.id, quantity, {
        name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
        price: effectivePrice,
        imageUrl: product.images?.[0]?.url || '',
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name,
        variantAttributes: selectedVariant?.attributes?.map((attr) => `${attr.name}: ${attr.value}`).join(', '),
        originalPrice: selectedVariant?.originalPrice || product.originalPrice || effectivePrice,
      });
      showToast('success', 'Đã thêm vào giỏ hàng!');
    }
  };

  const handleBuyNow = async () => {
    if (product) {
      const selectedVariant = product.variants?.[selectedVariantIndex];
      const effectivePrice = selectedVariant?.salePrice || product.price;
      await addItem(product.id, quantity, {
        name: selectedVariant ? `${product.name} - ${selectedVariant.name}` : product.name,
        price: effectivePrice,
        imageUrl: product.images?.[0]?.url || '',
        variantId: selectedVariant?.id,
        variantName: selectedVariant?.name,
        variantAttributes: selectedVariant?.attributes?.map((attr) => `${attr.name}: ${attr.value}`).join(', '),
        originalPrice: selectedVariant?.originalPrice || product.originalPrice || effectivePrice,
      });
      navigate('/checkout');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('error', 'Vui lòng đăng nhập để yêu thích sản phẩm');
      return;
    }
    try {
      if (isFavorite) {
        await favoriteAPI.remove(product!.id);
        setIsFavorite(false);
        showToast('success', 'Đã bỏ khỏi yêu thích');
      } else {
        await favoriteAPI.add(product!.id);
        setIsFavorite(true);
        showToast('success', 'Đã thêm vào yêu thích');
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Sản phẩm không tìm thấy</div>;
  }

  const selectedVariant = product.variants?.[selectedVariantIndex];
  const displayOriginalPrice = selectedVariant?.originalPrice || product.originalPrice || product.price;
  const displaySalePrice = selectedVariant?.salePrice || product.price;
  const displayStock = selectedVariant?.stock ?? product.stock ?? 0;
  const primaryAttributeName =
    product.variants?.find((variant) => (variant.attributes || []).length > 0)?.attributes?.[0]?.name || 'Biến thể';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/products" className="flex items-center text-gray-600 hover:text-primary-500 mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" /> Quay lại
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="card">
            {/* Main image */}
            <div className="relative">
              {product.images && product.images.length > 0 ? (
                <>
                  {product.images[selectedImageIndex]?.type === 'VIDEO' ? (
                    <video
                      src={product.images[selectedImageIndex]?.url}
                      controls
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  ) : (
                    <img
                      src={product.images[selectedImageIndex]?.url || product.imageUrl || 'https://via.placeholder.com/500'}
                      alt={product.name}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  )}
                </>
              ) : (
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/500'}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              )}

              {/* Navigation arrows */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + product.images!.length) % product.images!.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % product.images!.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {product.images.map((img: ProductImage, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary-500' : 'border-gray-200'
                    }`}
                  >
                    {img.type === 'VIDEO' ? (
                      <video src={img.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={img.url} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
              <span className="font-medium">{product.rating}</span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-gray-600">{product.reviewCount} đánh giá</span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="text-gray-600">{product.soldCount} đã bán</span>
            </div>
            <div className="mb-4">
              {displayOriginalPrice > displaySalePrice && (
                <p className="text-lg text-gray-400 line-through">
                  {displayOriginalPrice.toLocaleString('vi-VN')} đ
                </p>
              )}
              <p className="text-3xl font-bold text-primary-500">
                {displaySalePrice.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <p className="text-gray-600 mb-6">{product.description}</p>

            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">{primaryAttributeName}:</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {product.variants.map((variant, index) => (
                    <button
                      key={variant.id || index}
                      onClick={() => setSelectedVariantIndex(index)}
                      className={`px-3 py-2 border rounded-lg text-sm ${
                        selectedVariantIndex === index
                          ? 'border-primary-500 text-primary-600 bg-primary-50'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {(variant.attributes || []).find((attr) => attr.name === primaryAttributeName)?.value || variant.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.ingredients && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Thành phần:</h3>
                <p className="text-gray-600">{product.ingredients}</p>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={displayStock > 0 && quantity >= displayStock}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {/* Favorite button */}
              <button
                onClick={handleToggleFavorite}
                className={`p-3 rounded-lg border transition-colors ${
                  isFavorite
                    ? 'bg-red-50 border-red-300 text-red-500'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
                title="Yêu thích"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!product.isAvailable}
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Thêm vào giỏ
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product.isAvailable}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Đánh giá ({product.reviewCount})</h2>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">Chưa có đánh giá nào</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.userName}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>

                  {review.adminReply && (
                    <div className="mt-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
                      <p className="text-xs font-semibold text-primary-700 mb-1">Phản hồi từ FoodHub</p>
                      <p className="text-sm text-gray-700">{review.adminReply}</p>
                      {review.repliedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.repliedAt).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Món tương tự</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="card hover:shadow-lg transition">
                  <img
                    src={p.imageUrl || 'https://via.placeholder.com/300'}
                    alt={p.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-sm mb-1 truncate">{p.name}</h3>
                  <p className="text-primary-500 font-bold">{p.price.toLocaleString('vi-VN')} đ</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
