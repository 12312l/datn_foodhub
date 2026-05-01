import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminProductAPI, categoryAPI } from '../../services/api';
import { Category, ProductImage, ProductVariant } from '../../types';
import { useToast } from '../../components/user/Toast';
import { ArrowLeft, Plus, Upload, X, Image as ImageIcon, Video, Star, Clock } from 'lucide-react';

interface VariantGroup {
  name: string;
  values: string[];
}

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: '',
    price: 0,
    discount: 0,
    categoryId: 0,
    stock: 0,
    isNew: false,
    isFeatured: false,
    isAvailable: true,
  });

  const [images, setImages] = useState<Array<{ url: string; isPrimary: boolean; type: 'IMAGE' | 'VIDEO'; file?: File }>>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([{ name: '', values: [''] }]);
  const [expandedVariantIndex, setExpandedVariantIndex] = useState<number | null>(null);
  const hasVariants = variants.length > 0;
  const totalVariantStock = variants.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);

  useEffect(() => {
    if (!hasVariants) return;
    setFormData((prev) => (prev.stock === totalVariantStock ? prev : { ...prev, stock: totalVariantStock }));
  }, [hasVariants, totalVariantStock]);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const response = await adminProductAPI.getById(parseInt(id!));
      const product = response.data;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        ingredients: product.ingredients || '',
        price: product.price || 0,
        discount: product.discount || 0,
        categoryId: product.categoryId || 0,
        stock: product.stock || 0,
        isNew: product.isNew || false,
        isFeatured: product.isFeatured || false,
        isAvailable: product.isAvailable !== false,
      });

      // Load images from product
      const loadedImages: typeof images = [];

      if (product.images && product.images.length > 0) {
        product.images.forEach((img: ProductImage) => {
          if (img.url) {
            loadedImages.push({
              url: img.url,
              isPrimary: img.isPrimary || false,
              type: img.type || 'IMAGE',
              file: undefined
            });
          }
        });
      }

      // Fallback to imageUrl if no images
      if (loadedImages.length === 0 && product.imageUrl) {
        loadedImages.push({ url: product.imageUrl, isPrimary: true, type: 'IMAGE', file: undefined });
      }

      setImages(loadedImages);

      setVariants(
        (product.variants || []).map((variant: ProductVariant) => ({
          id: variant.id,
          name: variant.name || '',
          originalPrice: Number(variant.originalPrice) || 0,
          salePrice: Number(variant.salePrice) || 0,
          stock: Number(variant.stock) || 0,
          isDefault: Boolean(variant.isDefault),
          preparationTime: variant.preparationTime || 15, // THÊM DÒNG NÀY
          attributes: (variant.attributes || []).map((attr) => ({
            name: attr.name || '',
            value: attr.value || '',
          })),
        }))
      );

      const groupMap = new Map<string, Set<string>>();
      (product.variants || []).forEach((variant: ProductVariant) => {
        (variant.attributes || []).forEach((attr) => {
          const attrName = (attr.name || '').trim();
          const attrValue = (attr.value || '').trim();
          if (!attrName || !attrValue) return;
          if (!groupMap.has(attrName)) {
            groupMap.set(attrName, new Set<string>());
          }
          groupMap.get(attrName)!.add(attrValue);
        });
      });

      if (groupMap.size > 0) {
        setVariantGroups(
          Array.from(groupMap.entries()).map(([name, valueSet]) => ({
            name,
            values: Array.from(valueSet),
          }))
        );
      }
    } catch (error) {
      console.error('Error loading product:', error);
      showToast('error', 'Không thể tải thông tin sản phẩm');
      navigate('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: typeof images = [];
    Array.from(files).forEach((file) => {
      const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      const url = URL.createObjectURL(file);
      newImages.push({
        url,
        isPrimary: images.length === 0 && newImages.length === 0,
        type,
        file,
      });
    });

    setImages([...images, ...newImages]);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    if (removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url);
    }

    // If removed image was primary, set first image as primary
    if (removed.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    setImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    })));
  };

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: '',
        originalPrice: 0,
        salePrice: 0,
        stock: 0,
        isDefault: prev.length === 0,
        preparationTime: 15,
        attributes: [{ name: '', value: '' }],
      },
    ]);
    setExpandedVariantIndex(variants.length);
  };

  const addVariantGroup = () => {
    setVariantGroups((prev) => [...prev, { name: '', values: [''] }]);
  };

  const removeVariantGroup = (index: number) => {
    setVariantGroups((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [{ name: '', values: [''] }];
    });
  };

  const updateVariantGroupName = (index: number, value: string) => {
    setVariantGroups((prev) => prev.map((group, i) => (i === index ? { ...group, name: value } : group)));
  };

  const addVariantGroupValue = (groupIndex: number) => {
    setVariantGroups((prev) =>
      prev.map((group, i) =>
        i === groupIndex ? { ...group, values: [...group.values, ''] } : group
      )
    );
  };

  const updateVariantGroupValue = (groupIndex: number, valueIndex: number, value: string) => {
    setVariantGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        const nextValues = group.values.map((v, idx) => (idx === valueIndex ? value : v));
        return { ...group, values: nextValues };
      })
    );
  };

  const removeVariantGroupValue = (groupIndex: number, valueIndex: number) => {
    setVariantGroups((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        const nextValues = group.values.filter((_, idx) => idx !== valueIndex);
        return { ...group, values: nextValues.length > 0 ? nextValues : [''] };
      })
    );
  };

  const generateVariantsFromGroups = () => {
    const normalizedGroups = variantGroups
      .map((group) => ({
        name: group.name.trim(),
        values: group.values
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((group) => group.name && group.values.length > 0);

    if (normalizedGroups.length === 0) {
      showToast('error', 'Vui lòng nhập ít nhất 1 thuộc tính và giá trị để sinh biến thể');
      return;
    }

    if (variants.length > 0) {
      const shouldReplace = window.confirm('Sinh lại biến thể sẽ thay thế danh sách biến thể hiện tại. Tiếp tục?');
      if (!shouldReplace) return;
    }

    type CombinationItem = { name: string; value: string };
    const combinations = normalizedGroups.reduce<CombinationItem[][]>(
      (acc, group) => {
        if (acc.length === 0) {
          return group.values.map((value) => [{ name: group.name, value }]);
        }
        return acc.flatMap((combo) => group.values.map((value) => [...combo, { name: group.name, value }]));
      },
      []
    );

    const defaultPrice = formData.price > 0 ? formData.price : 0;
    const defaultStock = formData.stock > 0 ? formData.stock : 0;
    const generated = combinations.map((combo, index) => ({
      name: combo.map((item) => item.value).join(' / '),
      originalPrice: defaultPrice,
      salePrice: defaultPrice,
      stock: defaultStock,
      preparationTime: 15, // <--- THÊM DÒNG NÀY (Giá trị mặc định khi sinh ra)
      isDefault: index === 0,
      attributes: combo,
    }));

    setVariants(generated);
    setExpandedVariantIndex(generated.length > 0 ? 0 : null);
    showToast('success', `Đã sinh ${generated.length} biến thể`);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((v) => v.isDefault)) {
        updated[0].isDefault = true;
      }
      return [...updated];
    });
  };

  const updateVariantField = <K extends keyof ProductVariant>(index: number, field: K, value: ProductVariant[K]) => {
    setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)));
  };

  const setDefaultVariant = (index: number) => {
    setVariants((prev) => prev.map((variant, i) => ({ ...variant, isDefault: i === index })));
  };

  const addVariantAttribute = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, idx) =>
        idx === variantIndex
          ? { ...variant, attributes: [...(variant.attributes || []), { name: '', value: '' }] }
          : variant
      )
    );
  };

  const removeVariantAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        const nextAttrs = (variant.attributes || []).filter((_, i) => i !== attrIndex);
        return { ...variant, attributes: nextAttrs.length > 0 ? nextAttrs : [{ name: '', value: '' }] };
      })
    );
  };

  const updateVariantAttribute = (variantIndex: number, attrIndex: number, field: 'name' | 'value', value: string) => {
    setVariants((prev) =>
      prev.map((variant, idx) => {
        if (idx !== variantIndex) return variant;
        const nextAttrs = (variant.attributes || []).map((attr, i) =>
          i === attrIndex ? { ...attr, [field]: value } : attr
        );
        return { ...variant, attributes: nextAttrs };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('error', 'Vui lòng nhập tên sản phẩm');
      return;
    }
    if (variants.length === 0 && formData.price <= 0) {
      showToast('error', 'Vui lòng nhập giá sản phẩm');
      return;
    }
    if (formData.categoryId === 0) {
      showToast('error', 'Vui lòng chọn danh mục');
      return;
    }

    setIsSaving(true);
    try {
      // Upload new images first
      const uploadedImages: Array<{ url: string; isPrimary: boolean; type: 'IMAGE' | 'VIDEO' }> = [];

      for (const img of images) {
        if (img.file) {
          // This is a new file that needs uploading
          const uploadFormData = new FormData();
          uploadFormData.append('file', img.file);
          if (img.type === 'VIDEO') {
            uploadFormData.append('type', 'VIDEO');
          }

          try {
            const response = await adminProductAPI.uploadImage(uploadFormData);
            uploadedImages.push({
              url: response.data.url,
              isPrimary: img.isPrimary,
              type: img.type,
            });
          } catch (uploadError) {
            console.error('Upload failed for:', img.file.name, uploadError);
            // If upload fails, skip this image or use a placeholder
            showToast('error', `Không thể upload ${img.file.name}`);
          }
        } else {
          // This is an existing image URL (not a file)
          uploadedImages.push({
            url: img.url,
            isPrimary: img.isPrimary,
            type: img.type,
          });
        }
      }

      const normalizedVariants = variants
        .map((variant) => ({
          ...variant,
          name: variant.name.trim(),
          attributes: (variant.attributes || [])
            .map((attr) => ({ name: attr.name.trim(), value: attr.value.trim() }))
            .filter((attr) => attr.name && attr.value),
        }))
        .filter((variant) => variant.name && variant.originalPrice > 0 && variant.salePrice > 0);

      const productData = {
        ...formData,
        imageUrl: uploadedImages.find(img => img.isPrimary)?.url || uploadedImages[0]?.url || '',
        images: uploadedImages,
        variants: normalizedVariants,
      };

      if (isEdit) {
        await adminProductAPI.update(parseInt(id!), productData);
        showToast('success', 'Cập nhật sản phẩm thành công');
      } else {
        await adminProductAPI.create(productData);
        showToast('success', 'Thêm sản phẩm thành công');
      }
      navigate('/admin/products');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[100px]"
                placeholder="Nhập mô tả sản phẩm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phần/Nguyên liệu</label>
              <textarea
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[80px]"
                placeholder="Liệt kê các thành phần, nguyên liệu của sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min="0"
                max="100"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={0}>Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                disabled={hasVariants}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${hasVariants ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                min="0"
                placeholder="0"
              />
              {hasVariants && (
                <p className="text-xs text-gray-500 mt-1">
                  Tồn kho tổng được tự động tính từ tồn kho các biến thể: {totalVariantStock}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Biến thể và mức giá</h2>
            <button
              type="button"
              onClick={addVariant}
              className="px-3 py-2 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Thêm biến thể
            </button>
          </div>

          <div className="border border-dashed border-gray-300 rounded-lg p-4 mb-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">Sinh nhanh biến thể từ thuộc tính</h3>
              <button
                type="button"
                onClick={addVariantGroup}
                className="text-sm text-primary-600 hover:underline"
              >
                + Thêm thuộc tính
              </button>
            </div>

            <div className="space-y-2">
              {variantGroups.map((group, index) => (
                <div key={index} className="border rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateVariantGroupName(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Tên thuộc tính (VD: Size, Màu)"
                    />
                    <button
                      type="button"
                      onClick={() => removeVariantGroup(index)}
                      className="px-2 text-red-500 hover:text-red-600"
                      title="Xóa thuộc tính"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {group.values.map((value, valueIndex) => (
                      <div key={valueIndex} className="grid grid-cols-[1fr_auto] gap-2">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateVariantGroupValue(index, valueIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Nhập tên giá trị (VD: S, M, L hoặc Đỏ, Đen)"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantGroupValue(index, valueIndex)}
                          className="px-2 text-red-500 hover:text-red-600"
                          title="Xóa giá trị"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addVariantGroupValue(index)}
                    className="mt-2 text-sm text-primary-600 hover:underline"
                  >
                    + Thêm tên
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={generateVariantsFromGroups}
                className="px-3 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600"
              >
                Sinh biến thể
              </button>
            </div>
          </div>

          {variants.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có biến thể. Bạn có thể dùng giá chung hoặc thêm biến thể để có giá gốc và giá bán riêng.</p>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">Biến thể {variantIndex + 1}</h3>
                      <p className="text-xs text-gray-500">{(variant.attributes || []).map((attr) => `${attr.name}: ${attr.value}`).filter(Boolean).join(' | ') || 'Chưa có thuộc tính'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedVariantIndex(expandedVariantIndex === variantIndex ? null : variantIndex)}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {expandedVariantIndex === variantIndex ? 'Thu gọn' : 'Mở rộng'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeVariant(variantIndex)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tên biến thể</label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariantField(variantIndex, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="VD: L / đỏ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Giá gốc</label>
                      <input
                        type="number"
                        value={variant.originalPrice}
                        onChange={(e) => updateVariantField(variantIndex, 'originalPrice', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Giá bán</label>
                      <input
                        type="number"
                        value={variant.salePrice}
                        onChange={(e) => updateVariantField(variantIndex, 'salePrice', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tồn kho</label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariantField(variantIndex, 'stock', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                    {/* THÊM Ô THỜI GIAN VÀO ĐÂY */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Thời gian nấu (phút)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={variant.preparationTime || 15}
                          onChange={(e) => updateVariantField(variantIndex, 'preparationTime', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-8 focus:ring-2 focus:ring-primary-500"
                          min="1"
                        />
                        <Clock className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={variant.isDefault}
                        onChange={() => setDefaultVariant(variantIndex)}
                      />
                      Đặt làm biến thể mặc định
                    </label>
                  </div>

                  {expandedVariantIndex === variantIndex && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">Thuộc tính biến thể</p>
                        <button
                          type="button"
                          onClick={() => addVariantAttribute(variantIndex)}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          + Thêm thuộc tính
                        </button>
                      </div>
                      {(variant.attributes || []).map((attr, attrIndex) => (
                        <div key={attrIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                          <input
                            type="text"
                            value={attr.name}
                            onChange={(e) => updateVariantAttribute(variantIndex, attrIndex, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Tên thuộc tính (VD: Size, Vị)"
                          />
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) => updateVariantAttribute(variantIndex, attrIndex, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Giá trị (VD: L, Cay vừa)"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantAttribute(variantIndex, attrIndex)}
                            className="px-2 text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Hình ảnh & Video</h2>

          {/* Upload area */}
          <div className="mb-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click để tải ảnh hoặc video</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Image list */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-primary-500' : 'border-gray-200'
                    }`}
                >
                  {img.type === 'VIDEO' ? (
                    <video
                      src={img.url}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLVideoElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <img
                      src={img.url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.closest('.relative');
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-img') as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }
                      }}
                    />
                  )}
                  {/* Fallback for broken images - shown when image fails to load */}
                  {img.type !== 'VIDEO' && (
                    <div className="fallback-img w-full h-32 bg-gray-200 flex items-center justify-center" style={{ display: 'none' }}>
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    {img.type === 'VIDEO' ? (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Ảnh
                      </span>
                    )}
                  </div>

                  {/* Primary badge */}
                  {img.isPrimary && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-primary-500 text-white text-xs rounded flex items-center gap-1">
                        <Star className="w-3 h-3" /> Chính
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="p-1 bg-white rounded shadow hover:bg-gray-100"
                        title="Đặt làm ảnh chính"
                      >
                        <Star className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 bg-white rounded shadow hover:bg-red-50"
                      title="Xóa"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Trạng thái</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700">Cho phép bán</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700">Sản phẩm mới</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700">Sản phẩm nổi bật</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm mới')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductFormPage;
