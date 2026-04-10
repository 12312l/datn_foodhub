import React, { useState, useEffect } from 'react';
import { adminCategoryAPI } from '../../services/api';
import { Category } from '../../types';
import { useToast } from '../../components/user/Toast';
import { Plus, Edit, Trash2, Search, Image, X } from 'lucide-react';

const AdminCategoriesPage: React.FC = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const response = await adminCategoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload image if selected
      if (imageFile) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        try {
          const response = await adminCategoryAPI.uploadImage(uploadFormData);
          imageUrl = response.data.url;
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          showToast('error', 'Upload ảnh thất bại');
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      const categoryData = {
        ...formData,
        imageUrl,
      };

      if (editingCategory) {
        await adminCategoryAPI.update(editingCategory.id, categoryData);
        showToast('success', 'Cập nhật danh mục thành công');
      } else {
        await adminCategoryAPI.create(categoryData);
        showToast('success', 'Thêm danh mục thành công');
      }
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    setIsLoading(true);
    try {
      await adminCategoryAPI.delete(id);
      showToast('success', 'Xóa danh mục thành công');
      loadCategories();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Xóa thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });
    setImageFile(null);
    setImagePreview(category.imageUrl || null);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm danh mục
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Đang tải...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">Không có danh mục nào</div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start gap-4">
                {category.imageUrl ? (
                  <img src={category.imageUrl} alt={category.name} className="w-20 h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl text-gray-400">{category.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{category.description || 'Không có mô tả'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => openEditModal(category)}
                  className="btn btn-secondary flex items-center gap-1 text-sm"
                >
                  <Edit className="w-4 h-4" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh danh mục</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg mx-auto" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="category-image-upload"
                      />
                      <label htmlFor="category-image-upload" className="cursor-pointer">
                        <Image className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">Click để tải ảnh lên</p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF</p>
                      </label>
                    </>
                  )}
                </div>
                {imagePreview && (
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="input mt-2"
                    placeholder="Hoặc nhập URL ảnh"
                  />
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={isLoading || isUploading} className="btn btn-primary">
                  {isLoading || isUploading ? 'Đang lưu...' : (editingCategory ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
