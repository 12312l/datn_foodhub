import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import { Product, Category } from '../../types';

const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  const currentPage = parseInt(searchParams.get('page') || '0');
  const filters = {
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortDir: searchParams.get('sortDir') || 'desc',
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // const loadProducts = async () => {
  //   setIsLoading(true);
  //   try {
  //     const params: any = {
  //       page: currentPage,
  //       size: 12,
  //       sortBy: filters.sortBy,
  //       sortDir: filters.sortDir,
  //     };

  //     let response;
  //     if (filters.search) {
  //       response = await productAPI.search(filters.search, params);
  //     } else if (filters.category) {
  //       response = await productAPI.getByCategory(parseInt(filters.category), params);
  //     } else {
  //       response = await productAPI.getAll(params);
  //     }

  //     setProducts(response.data.content);
  //     setTotalPages(response.data.totalPages);
  //   } catch (error) {
  //     console.error('Error loading products:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // Đảm bảo tên key (sortBy, sortDir) khớp 100% với @RequestParam bên Java
      const params = {
        page: currentPage,
        size: 12,
        sortBy: filters.sortBy, // ví dụ: 'price'
        sortDir: filters.sortDir, // ví dụ: 'asc'
      };

      let response;
      if (filters.search) {
        // Kiểm tra xem hàm search trong api.ts có nhận params làm tham số thứ 2 không
        response = await productAPI.search(filters.search, params);
      } else if (filters.category) {
        response = await productAPI.getByCategory(parseInt(filters.category), params);
      } else {
        // Đối với getAll, truyền trực tiếp object params
        response = await productAPI.getAll(params);
      }

      setProducts(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams);
      if (searchValue) {
        params.set('search', searchValue);
      } else {
        params.delete('search');
      }
      params.set('page', '0');
      setSearchParams(params);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '0');
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm món ăn... (Enter để tìm)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={handleSearch}
                className="input pl-10"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input md:w-48"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={`${filters.sortBy}-${filters.sortDir}`}
              onChange={(e) => {
                const [sortBy, sortDir] = e.target.value.split('-');

                // Tạo bản sao mới của params để cập nhật 1 lần duy nhất
                const params = new URLSearchParams(searchParams);
                params.set('sortBy', sortBy);
                params.set('sortDir', sortDir);
                params.set('page', '0'); // Reset về trang đầu

                setSearchParams(params); // Cập nhật URL 1 lần duy nhất
              }}
              className="input md:w-48"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="soldCount-desc">Bán chạy</option>
              <option value="rating-desc">Đánh giá cao</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không tìm thấy món ăn nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.id}`} className="card hover:shadow-lg transition">
                  <div className="relative">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    {product.isNew && (
                      <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Mới
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Nổi bật
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 truncate">{product.categoryName}</p>
                  <div className="flex items-center mb-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm text-gray-600">{product.rating}</span>
                    <span className="text-sm text-gray-400 ml-2">| {product.soldCount} đã bán</span>
                  </div>
                  <p className="text-primary-500 font-bold text-lg">{product.price.toLocaleString('vi-VN')} đ</p>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(0, currentPage - 2);
                  if (page >= totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`btn ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {page + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
