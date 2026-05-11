import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus, toggleProductFeatured } from '../../services/productService';
import { getAllCategories } from '../../services/categoryService';
import { Product, ProductForm } from '../../types/product';
import { Category } from '../../types/category';
import { formatCurrency } from '../../utils/formatCurrency';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PLACEHOLDER_IMAGE } from '../../config/constants';
import { getProductPrimaryImage, normalizeProductImageUrl } from '../../utils/productImages';
import ProductCardImage from '../../components/products/ProductCardImage';
import { Plus, Pencil, Trash2, Package, Star, Eye, EyeOff, GripVertical, X, ImagePlus, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';

const emptyForm: ProductForm = {
  name: '',
  description: '',
  nameAr: '',
  descriptionAr: '',
  price: 0,
  discountPrice: 0,
  categoryId: '',
  image: '',
  images: [],
  stock: 0,
  status: 'active',
  featured: false,
  imageFit: 'contain',
  imageScale: 1,
  imagePositionX: 50,
  imagePositionY: 50,
  imageBg: '',
};

interface PendingImageUpload {
  id: string;
  name: string;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'error';
  error?: string;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ProductsManagement() {
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [imageUploads, setImageUploads] = useState<PendingImageUpload[]>([]);

  const isUploadingImages = imageUploads.some((upload) => upload.status === 'uploading');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, c] = await Promise.all([getAllProducts(), getAllCategories()]);
      setProducts(p); setCategories(c);
    } catch { toast.error(t('toast.failedToLoad')); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm, images: [] });
    setImageUploads([]);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    // Populate images from the product - backward compatible
    let images: string[] = [];
    if (p.images && Array.isArray(p.images) && p.images.length > 0) {
      images = p.images.map(url => normalizeProductImageUrl(url));
    } else if (p.image) {
      images = [normalizeProductImageUrl(p.image)];
    }
    setForm({
      name: p.name,
      description: p.description,
      nameAr: p.nameAr || '',
      descriptionAr: p.descriptionAr || '',
      price: p.price,
      discountPrice: p.discountPrice,
      categoryId: p.categoryId,
      image: p.image || '',
      images,
      stock: p.stock,
      status: p.status,
      featured: p.featured,
      imageFit: p.imageFit || 'contain',
      imageScale: p.imageScale || 1,
      imagePositionX: p.imagePositionX ?? 50,
      imagePositionY: p.imagePositionY ?? 50,
      imageBg: p.imageBg || '',
    });
    setImageUploads([]);
    setModalOpen(true);
  };

  // Image upload management
  const clearImageUploads = () => {
    setImageUploads((current) => {
      current.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
      return [];
    });
  };

  const closeProductModal = () => {
    clearImageUploads();
    setModalOpen(false);
  };

  const removeImageField = (index: number) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
  };

  const removePendingImageUpload = (id: string) => {
    setImageUploads((current) => {
      const upload = current.find((item) => item.id === id);
      if (upload) URL.revokeObjectURL(upload.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const handleProductImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    files.forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('toast.imageUploadFailed'));
        return;
      }

      const id = `${Date.now()}-${index}-${file.name}`;
      const previewUrl = URL.createObjectURL(file);

      setImageUploads((current) => [
        ...current,
        {
          id,
          name: file.name,
          previewUrl,
          progress: 0,
          status: 'uploading',
        },
      ]);

      uploadImageToCloudinary(file, (progress) => {
        setImageUploads((current) =>
          current.map((upload) =>
            upload.id === id ? { ...upload, progress } : upload
          )
        );
      })
        .then((result) => {
          setForm((current) => ({
            ...current,
            images: [
              ...current.images.filter((url) => url && url.trim() !== ''),
              result.secureUrl,
            ],
          }));
          removePendingImageUpload(id);
          toast.success(t('toast.imageUploaded'));
        })
        .catch((error: Error) => {
          setImageUploads((current) =>
            current.map((upload) =>
              upload.id === id
                ? { ...upload, status: 'error', error: error.message }
                : upload
            )
          );
          toast.error(t('toast.imageUploadFailed'));
        });
    });
  };

  // Drag and drop reorder
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newImages = [...form.images];
    const draggedItem = newImages[dragIndex];
    newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setDragIndex(index);
    setForm({ ...form, images: newImages });
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleSave = async () => {
    if (isUploadingImages) { toast.error(t('toast.waitForUpload')); return; }
    if (!form.name.trim()) { toast.error(t('validation.nameRequired')); return; }
    if (form.price < 0) { toast.error(t('validation.negativePrice')); return; }
    if (form.stock < 0) { toast.error(t('validation.negativeStock')); return; }

    // Validate discount price
    if (form.discountPrice > 0 && form.discountPrice >= form.price) {
      toast.error(t('validation.discountExceedsPrice'));
      return;
    }

    // Validate images
    const validImages = form.images
      .map(url => normalizeProductImageUrl(url))
      .filter((url) => url && url.trim() !== '');

    if (validImages.length === 0) {
      toast.error(t('validation.imageRequired'));
      return;
    }

    for (const url of validImages) {
      if (!isValidUrl(url)) {
        toast.error(t('validation.invalidImageUrl'));
        return;
      }
      if (url.includes('google.com') && !url.startsWith('https://')) {
        toast.error(t('validation.invalidImageUrl'));
        return;
      }
    }

    // Validate stock is integer
    if (!Number.isInteger(Number(form.stock))) {
      toast.error(t('validation.stockInteger'));
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        ...form,
        images: validImages,
        image: validImages[0] || '',
      };

      if (editId) {
        await updateProduct(editId, saveData);
        toast.success(t('toast.productUpdated'));
      } else {
        await createProduct(saveData);
        toast.success(t('toast.productCreated'));
      }
      closeProductModal();
      await load();
    } catch { toast.error(t('toast.failedToSave')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('toast.deleteProductConfirm'))) return;
    try { await deleteProduct(id); toast.success(t('toast.deleted')); await load(); }
    catch { toast.error(t('toast.failedToDelete')); }
  };

  const handleToggleStatus = async (p: Product) => {
    try {
      const s = p.status === 'active' ? 'inactive' : 'active';
      await toggleProductStatus(p.id, s); toast.success(t('toast.productStatusChanged', { status: t(`status.${s}`) })); await load();
    } catch { toast.error(t('toast.failedToSave')); }
  };

  const handleToggleFeatured = async (p: Product) => {
    try { await toggleProductFeatured(p.id, !p.featured); toast.success(p.featured ? t('toast.unfeatured') : t('toast.featured')); await load(); }
    catch { toast.error(t('toast.failedToSave')); }
  };

  const getCategoryName = (id: string) => {
    const category = categories.find(c => c.id === id);
    return category ? getLocalizedName(category, i18n.language) : t('common.notAvailable');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('admin.products')}</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-astro-600 text-white rounded-xl hover:bg-astro-500 transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> {t('admin.addProduct')}
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState icon={Package} title={t('admin.noProducts')} description={t('admin.noProductsDescription')} action={<button onClick={openAdd} className="px-4 py-2 bg-astro-600 text-white rounded-xl text-sm">{t('admin.addProduct')}</button>} />
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark-800">
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('admin.product')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden md:table-cell">{t('common.category')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.price')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden sm:table-cell">{t('common.stock')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.status')}</th>
                <th className="text-end px-4 py-3 text-dark-400 font-medium">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center p-1 flex-shrink-0">
                          <img
                            src={getProductPrimaryImage(p)}
                            alt={getLocalizedName(p, i18n.language)}
                            className="max-w-full max-h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-white truncate max-w-[200px]">{getLocalizedName(p, i18n.language)}</p>
                          <div className="flex items-center gap-1">
                            {p.featured && <span className="text-xs text-astro-400 flex items-center gap-1"><Star className="w-3 h-3 fill-astro-400" /> {t('admin.featured')}</span>}
                            {(p.images?.length ?? 0) > 1 && (
                              <span className="text-xs text-dark-500">{p.images!.length} {t('admin.images')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-300 hidden md:table-cell">{getCategoryName(p.categoryId)}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{formatCurrency(p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price)}</p>
                      {p.discountPrice > 0 && p.discountPrice < p.price && <p className="text-xs text-dark-500 line-through">{formatCurrency(p.price)}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={p.stock > 0 ? 'text-dark-300' : 'text-red-400'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg ${p.status === 'active' ? 'bg-astro-500/10 text-astro-400' : 'bg-dark-800 text-dark-300'}`}>{t(`status.${p.status}`)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleFeatured(p)} className={`p-1.5 rounded-lg transition-colors ${p.featured ? 'text-astro-400 hover:bg-astro-500/10' : 'text-dark-500 hover:bg-dark-800'}`} title={t('admin.toggleFeatured')}><Star className="w-4 h-4" /></button>
                        <button onClick={() => handleToggleStatus(p)} className="p-1.5 text-dark-500 hover:text-white hover:bg-dark-800 rounded-lg transition-colors" title={t('admin.toggleStatus')}>{p.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-dark-500 hover:text-astro-400 hover:bg-astro-500/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeProductModal} title={editId ? t('admin.editProduct') : t('admin.addProduct')} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pe-1">
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('common.name')} *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.description')}</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all resize-none" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.arabicName')}</label><input value={form.nameAr || ''} onChange={e => setForm({...form, nameAr: e.target.value})} placeholder={t('admin.arabicNamePlaceholder')} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.arabicDescription')}</label><textarea value={form.descriptionAr || ''} onChange={e => setForm({...form, descriptionAr: e.target.value})} placeholder={t('admin.arabicDescriptionPlaceholder')} rows={3} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('common.price')} *</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
            <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.discountPrice')}</label><input type="number" min="0" step="0.01" value={form.discountPrice} onChange={e => setForm({...form, discountPrice: Number(e.target.value)})} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('common.category')}</label><select value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50"><option value="">{t('admin.select')}</option>{categories.map(c => <option key={c.id} value={c.id}>{getLocalizedName(c, i18n.language)}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('common.stock')} *</label><input type="number" min="0" step="1" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
          </div>

          {/* Product Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-dark-300">
                {t('admin.productImages')} * <span className="text-dark-500 font-normal">({t('admin.dragToReorder')})</span>
              </label>
              <label
                htmlFor="product-image-upload"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-astro-400 bg-astro-500/10 border border-astro-500/20 rounded-lg hover:bg-astro-500/20 transition-all cursor-pointer ${
                  isUploadingImages ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {t('admin.chooseImages')}
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleProductImageUpload}
                  disabled={isUploadingImages}
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-xl border border-dashed border-dark-600 bg-dark-800/40 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-dark-900 border border-dark-700 flex items-center justify-center text-astro-400 flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t('admin.cloudinaryHelper')}</p>
                  <p className="text-xs text-dark-400 mt-1">{t('admin.uploadHint')}</p>
                </div>
              </div>

              {imageUploads.length > 0 && (
                <div className="mt-4 space-y-2">
                  {imageUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center gap-3 rounded-xl border border-dark-700 bg-dark-900/70 p-2">
                      <img src={upload.previewUrl} alt="" className="w-12 h-12 rounded-lg object-cover bg-dark-800" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-medium text-white">{upload.name}</p>
                          {upload.status === 'uploading' ? (
                            <span className="flex items-center gap-1 text-xs text-astro-400">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {upload.progress}%
                            </span>
                          ) : (
                            <span className="text-xs text-red-400">{t('toast.imageUploadFailed')}</span>
                          )}
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-dark-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${upload.status === 'error' ? 'bg-red-500' : 'bg-astro-500'}`}
                            style={{ width: `${upload.status === 'error' ? 100 : upload.progress}%` }}
                          />
                        </div>
                        {upload.error && <p className="mt-1 text-xs text-red-400 line-clamp-1">{upload.error}</p>}
                      </div>
                      {upload.status === 'error' && (
                        <button
                          type="button"
                          onClick={() => removePendingImageUpload(upload.id)}
                          className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                          title={t('admin.removeImage')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {form.images.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {form.images.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`group relative rounded-xl border border-dark-700 bg-dark-900 overflow-hidden transition-all ${
                        dragIndex === index ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="aspect-square flex items-center justify-center bg-dark-950">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
                        />
                      </div>
                      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 bg-gradient-to-b from-dark-950/80 to-transparent">
                        <span className="flex items-center gap-1 text-xs font-medium text-white">
                          <GripVertical className="w-3.5 h-3.5 cursor-grab active:cursor-grabbing" />
                          {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImageField(index)}
                          className="p-1.5 text-white bg-dark-950/70 hover:bg-red-500 rounded-lg transition-colors"
                          title={t('admin.removeImage')}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dark-700 bg-dark-900/50 px-4 py-8 text-center text-sm text-dark-400">
                  {t('admin.noImagesYet')}
                </div>
              )}
            </div>
          </div>

          {/* Image Display Settings */}
          <div className="pt-6 border-t border-dark-700">
            <h3 className="text-lg font-bold text-white mb-4">{t('admin.imageDisplaySettings')}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.imageFit')}</label>
                  <select 
                    value={form.imageFit || 'contain'} 
                    onChange={e => setForm({...form, imageFit: e.target.value as 'contain' | 'cover'})} 
                    className="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50"
                  >
                    <option value="contain">{t('admin.contain')}</option>
                    <option value="cover">{t('admin.cover')}</option>
                  </select>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-dark-300">{t('admin.imageScale')}</label>
                    <span className="text-xs text-astro-400 font-mono">{form.imageScale}x</span>
                  </div>
                  <input type="range" min="0.8" max="1.8" step="0.05" value={form.imageScale || 1} onChange={e => setForm({...form, imageScale: Number(e.target.value)})} className="w-full accent-astro-500" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-dark-300">{t('admin.imagePositionX')}</label>
                    <span className="text-xs text-astro-400 font-mono">{form.imagePositionX ?? 50}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={form.imagePositionX ?? 50} onChange={e => setForm({...form, imagePositionX: Number(e.target.value)})} className="w-full accent-astro-500" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-dark-300">{t('admin.imagePositionY')}</label>
                    <span className="text-xs text-astro-400 font-mono">{form.imagePositionY ?? 50}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={form.imagePositionY ?? 50} onChange={e => setForm({...form, imagePositionY: Number(e.target.value)})} className="w-full accent-astro-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.imageBg')}</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.imageBg || '#0f172a'} onChange={e => setForm({...form, imageBg: e.target.value})} className="w-10 h-10 rounded border-0 cursor-pointer bg-dark-800" />
                    <input type="text" value={form.imageBg || ''} onChange={e => setForm({...form, imageBg: e.target.value})} placeholder="#0f172a (Leave empty for default)" className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50" />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">{t('admin.livePreview')}</label>
                <div className="w-64 max-w-full mx-auto border border-dark-700 rounded-2xl overflow-hidden shadow-2xl">
                  {form.images[0] ? (
                    <ProductCardImage 
                      src={form.images[0]} 
                      alt="Preview" 
                      fit={form.imageFit}
                      scale={form.imageScale}
                      posX={form.imagePositionX}
                      posY={form.imagePositionY}
                      bg={form.imageBg}
                    />
                  ) : (
                    <div className="w-full h-56 bg-dark-800 flex items-center justify-center text-dark-500 text-sm">{t('admin.noImagesYet')}</div>
                  )}
                </div>
              </div>
              
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="rounded border-dark-600 bg-dark-800 text-astro-500 focus:ring-astro-500" /><span className="text-sm text-dark-300">{t('admin.featured')}</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.status === 'active'} onChange={e => setForm({...form, status: e.target.checked ? 'active' : 'inactive'})} className="rounded border-dark-600 bg-dark-800 text-astro-500 focus:ring-astro-500" /><span className="text-sm text-dark-300">{t('admin.active')}</span></label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={closeProductModal} className="px-5 py-2.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-all text-sm">{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={saving || isUploadingImages} className="px-5 py-2.5 bg-astro-600 text-white rounded-xl hover:bg-astro-500 transition-all text-sm disabled:opacity-50">{isUploadingImages ? t('admin.uploading') : saving ? t('common.saving') : editId ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
