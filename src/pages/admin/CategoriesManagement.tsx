import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { Category, CategoryForm } from '../../types/category';
import { formatDate } from '../../utils/formatDate';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { PLACEHOLDER_CATEGORY_IMAGE } from '../../config/constants';
import { Plus, Pencil, Trash2, FolderTree, ImagePlus, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../../utils/localizedContent';
import { uploadImageToCloudinary } from '../../services/cloudinaryService';
import { normalizeImageUrl } from '../../utils/productImages';

const emptyForm: CategoryForm = { name: '', nameAr: '', slug: '', image: '' };

interface CategoryImageUpload {
  name: string;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'error';
  error?: string;
}

export default function CategoriesManagement() {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageUpload, setImageUpload] = useState<CategoryImageUpload | null>(null);

  const isUploadingImage = imageUpload?.status === 'uploading';
  const previewImage = imageUpload?.previewUrl || form.image;

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setCategories(await getAllCategories());
    } catch {
      toast.error(t('toast.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const clearCategoryImageUpload = () => {
    setImageUpload((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const closeCategoryModal = () => {
    clearCategoryImageUpload();
    setModalOpen(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    clearCategoryImageUpload();
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      nameAr: c.nameAr || '',
      slug: c.slug,
      image: c.image ? normalizeImageUrl(c.image) : '',
    });
    clearCategoryImageUpload();
    setModalOpen(true);
  };

  const handleCategoryImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('toast.imageUploadFailed'));
      return;
    }

    clearCategoryImageUpload();
    const previewUrl = URL.createObjectURL(file);
    setImageUpload({
      name: file.name,
      previewUrl,
      progress: 0,
      status: 'uploading',
    });

    uploadImageToCloudinary(file, (progress) => {
      setImageUpload((current) =>
        current ? { ...current, progress } : current
      );
    })
      .then((result) => {
        setForm((current) => ({ ...current, image: result.secureUrl }));
        setImageUpload((current) => {
          if (current) URL.revokeObjectURL(current.previewUrl);
          return null;
        });
        toast.success(t('toast.imageUploaded'));
      })
      .catch((error: Error) => {
        setImageUpload((current) =>
          current ? { ...current, status: 'error', error: error.message } : current
        );
        toast.error(t('toast.imageUploadFailed'));
      });
  };

  const removeCategoryImage = () => {
    if (imageUpload) {
      clearCategoryImageUpload();
      return;
    }
    clearCategoryImageUpload();
    setForm({ ...form, image: '' });
  };

  const handleSave = async () => {
    if (isUploadingImage) { toast.error(t('toast.waitForUpload')); return; }
    if (!form.name.trim()) { toast.error(t('validation.nameRequired')); return; }
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-');
    setSaving(true);
    try {
      if (editId) { await updateCategory(editId, { ...form, slug }); toast.success(t('toast.updated')); }
      else { await createCategory({ ...form, slug }); toast.success(t('toast.created')); }
      closeCategoryModal(); await load();
    } catch { toast.error(t('toast.failedToSave')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('toast.deleteCategoryConfirm'))) return;
    try { await deleteCategory(id); toast.success(t('toast.deleted')); await load(); }
    catch { toast.error(t('toast.failedToDelete')); }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('admin.categories')}</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-astro-600 text-white rounded-xl hover:bg-astro-500 transition-all text-sm font-medium"><Plus className="w-4 h-4" /> {t('admin.addCategory')}</button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={FolderTree} title={t('admin.noCategories')} description={t('admin.noCategoriesDescription')} action={<button onClick={openAdd} className="px-4 py-2 bg-astro-600 text-white rounded-xl text-sm">{t('admin.addCategory')}</button>} />
      ) : (
        <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-dark-800">
                <th className="text-start px-4 py-3 text-dark-400 font-medium">{t('common.category')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden sm:table-cell">{t('admin.slug')}</th>
                <th className="text-start px-4 py-3 text-dark-400 font-medium hidden md:table-cell">{t('admin.created')}</th>
                <th className="text-end px-4 py-3 text-dark-400 font-medium">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.image ? normalizeImageUrl(c.image) : PLACEHOLDER_CATEGORY_IMAGE}
                          alt={getLocalizedName(c, i18n.language)}
                          className="w-10 h-10 rounded-lg object-cover bg-dark-800"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY_IMAGE; }}
                        />
                        <span className="font-medium text-white">{getLocalizedName(c, i18n.language)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark-400 hidden sm:table-cell">{c.slug}</td>
                    <td className="px-4 py-3 text-dark-400 hidden md:table-cell">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-dark-500 hover:text-astro-400 hover:bg-astro-500/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeCategoryModal} title={editId ? t('admin.editCategory') : t('admin.addCategory')}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('common.name')} *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.arabicName')}</label><input value={form.nameAr || ''} onChange={e => setForm({...form, nameAr: e.target.value})} placeholder={t('admin.arabicNamePlaceholder')} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>
          <div><label className="block text-sm font-medium text-dark-300 mb-1">{t('admin.slug')}</label><input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder={t('admin.autoGenerated')} className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-astro-500/50 transition-all" /></div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-dark-300">{t('admin.categoryImage')}</label>
              <label
                htmlFor="category-image-upload"
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-astro-400 bg-astro-500/10 border border-astro-500/20 rounded-lg hover:bg-astro-500/20 transition-all cursor-pointer ${
                  isUploadingImage ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {form.image ? t('admin.replaceImage') : t('admin.chooseImage')}
                <input
                  id="category-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCategoryImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-xl border border-dashed border-dark-600 bg-dark-800/40 p-4">
              {previewImage ? (
                <div className="relative overflow-hidden rounded-xl border border-dark-700 bg-dark-950">
                  <img
                    src={previewImage}
                    alt=""
                    className="w-full h-48 object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_CATEGORY_IMAGE; }}
                  />
                  <button
                    type="button"
                    onClick={removeCategoryImage}
                    disabled={isUploadingImage}
                    className="absolute top-2 end-2 p-1.5 text-white bg-dark-950/70 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-dark-950/70"
                    title={t('admin.removeImage')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {imageUpload && (
                    <div className="absolute inset-x-0 bottom-0 bg-dark-950/85 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-white">{imageUpload.name}</span>
                        {imageUpload.status === 'uploading' ? (
                          <span className="flex items-center gap-1 text-astro-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            {imageUpload.progress}%
                          </span>
                        ) : (
                          <span className="text-red-400">{t('toast.imageUploadFailed')}</span>
                        )}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-dark-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${imageUpload.status === 'error' ? 'bg-red-500' : 'bg-astro-500'}`}
                          style={{ width: `${imageUpload.status === 'error' ? 100 : imageUpload.progress}%` }}
                        />
                      </div>
                      {imageUpload.error && <p className="mt-1 text-xs text-red-400 line-clamp-1">{imageUpload.error}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <label htmlFor="category-image-upload" className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dark-700 bg-dark-900/50 px-4 py-8 text-center hover:border-astro-500/40 transition-colors">
                  <Upload className="w-8 h-8 text-astro-400 mb-3" />
                  <span className="text-sm font-medium text-white">{t('admin.chooseImage')}</span>
                  <span className="mt-1 text-xs text-dark-400">{t('admin.uploadHint')}</span>
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-dark-700">
            <button onClick={closeCategoryModal} className="px-5 py-2.5 bg-dark-800 text-white rounded-xl hover:bg-dark-700 transition-all text-sm">{t('common.cancel')}</button>
            <button onClick={handleSave} disabled={saving || isUploadingImage} className="px-5 py-2.5 bg-astro-600 text-white rounded-xl hover:bg-astro-500 transition-all text-sm disabled:opacity-50">{isUploadingImage ? t('admin.uploading') : saving ? t('common.saving') : editId ? t('common.update') : t('common.create')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
