import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getProductReviews,
  submitReview,
  deleteReview,
  hasUserPurchasedProduct,
} from '../../services/reviewService';
import { Review } from '../../types/product';
import StarRating from './StarRating';
import { MessageSquare, Trash2, Edit3, Send, ShieldCheck, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatRelativeDate } from '../../utils/formatDate';

interface ReviewsSectionProps {
  productId: string;
  ratingAverage?: number;
  ratingCount?: number;
}

export default function ReviewsSection({
  productId,
  ratingAverage = 0,
  ratingCount = 0,
}: ReviewsSectionProps) {
  const { t } = useTranslation();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadReviews();
    if (currentUser) {
      checkPurchaseStatus();
    }
  }, [productId, currentUser]);

  const loadReviews = async () => {
    try {
      const data = await getProductReviews(productId);
      setReviews(data);

      if (currentUser) {
        const existing = data.find((r) => r.userId === currentUser.uid);
        if (existing) {
          setUserReview(existing);
        }
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!currentUser) return;
    setCheckingPurchase(true);
    try {
      const purchased = await hasUserPurchasedProduct(currentUser.uid, productId);
      console.log(`[ReviewsSection] Purchase check for product ${productId}:`, purchased);
      setHasPurchased(purchased);
    } catch (err: any) {
      console.error('[ReviewsSection] Failed to check purchase status:', err?.code, err?.message);
      // If the query fails (e.g. permission error), allow review attempt
      // and let Firestore rules be the final gate
      setHasPurchased(true);
    } finally {
      setCheckingPurchase(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !userProfile) return;
    if (formRating < 1 || formRating > 5) {
      toast.error(t('reviews.invalidRating'));
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(
        productId,
        currentUser.uid,
        userProfile.name || currentUser.displayName || t('reviews.anonymous'),
        currentUser.email || '',
        formRating,
        formComment.trim()
      );
      toast.success(isEditing ? t('reviews.reviewUpdated') : t('reviews.reviewSubmitted'));
      setShowForm(false);
      setIsEditing(false);
      setFormComment('');
      setFormRating(5);
      await loadReviews();
    } catch (err: any) {
      toast.error(t('reviews.submitFailed'));
      console.error('Review submit error', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (userReview) {
      setFormRating(userReview.rating);
      setFormComment(userReview.comment || '');
      setIsEditing(true);
      setShowForm(true);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm(t('reviews.deleteConfirm'))) return;
    try {
      await deleteReview(productId, reviewId);
      toast.success(t('toast.deleted'));
      setUserReview(null);
      await loadReviews();
    } catch {
      toast.error(t('toast.failedToDelete'));
    }
  };

  return (
    <div className="mt-16 animate-fade-in">
      <div className="border-t border-dark-800 pt-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-astro-400" />
            <h2 className="text-2xl font-light tracking-wide uppercase text-white">{t('reviews.title')}</h2>
          </div>

          {/* Aggregate Rating */}
          {ratingCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-dark-900 border border-dark-700 rounded-none">
              <span className="text-2xl font-bold text-white">{ratingAverage.toFixed(1)}</span>
              <div>
                <StarRating rating={ratingAverage} size="sm" />
                <p className="text-xs text-dark-400 mt-0.5">
                  {t('reviews.basedOn', { count: ratingCount })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Write Review Button or Login Prompt */}
        <div className="mb-8">
          {!currentUser ? (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-5 py-3 bg-dark-800 border border-dark-700 text-dark-300 rounded-xl hover:bg-dark-700 hover:text-white transition-all text-sm"
            >
              <LogIn className="w-4 h-4" />
              {t('reviews.loginToReview')}
            </button>
          ) : !hasPurchased && !checkingPurchase ? (
            <div className="flex items-center gap-2 px-4 py-3 bg-dark-900 border border-dark-700 rounded-xl text-sm text-dark-300">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>{t('reviews.purchaseRequired')}</span>
            </div>
          ) : userReview && !showForm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-5 py-3 bg-astro-600/10 border border-astro-500/20 text-astro-400 rounded-xl hover:bg-astro-600/20 transition-all text-sm"
              >
                <Edit3 className="w-4 h-4" />
                {t('reviews.editReview')}
              </button>
            </div>
          ) : !showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white text-dark-950 rounded-none hover:bg-dark-200 transition-all text-sm font-medium uppercase tracking-widest shadow-xl"
            >
              <Edit3 className="w-4 h-4" />
              {t('reviews.writeReview')}
            </button>
          ) : null}
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-dark-900 border border-dark-700 rounded-none animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isEditing ? t('reviews.editYourReview') : t('reviews.writeYourReview')}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                {t('reviews.yourRating')}
              </label>
              <StarRating
                rating={formRating}
                size="lg"
                interactive
                onRate={setFormRating}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-dark-300 mb-2">
                {t('reviews.yourComment')}
              </label>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                rows={4}
                placeholder={t('reviews.commentPlaceholder')}
                className="w-full px-4 py-3 bg-dark-950 border border-dark-700 rounded-none text-white placeholder-dark-500 focus:outline-none focus:ring-1 focus:ring-astro-500 transition-all resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 bg-dark-800 border border-dark-700 text-white rounded-none hover:bg-dark-700 transition-all text-sm uppercase tracking-wide font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-dark-950 rounded-none hover:bg-dark-200 transition-all text-sm font-medium uppercase tracking-widest disabled:opacity-50 shadow-xl"
              >
                <Send className="w-4 h-4" />
                {submitting
                  ? t('common.saving')
                  : isEditing
                  ? t('common.update')
                  : t('reviews.submitReview')}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-astro-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-dark-900 border border-dark-800 rounded-none">
            <MessageSquare className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">{t('reviews.noReviews')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 bg-dark-900 border border-dark-800 rounded-none hover:border-dark-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-none border border-dark-700 bg-dark-950 flex items-center justify-center text-white font-medium text-sm">
                      {(review.userName || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{review.userName}</p>
                      <p className="text-xs text-dark-500">
                        {review.createdAt
                          ? formatRelativeDate(review.createdAt)
                          : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    {/* Delete button for own review or admin */}
                    {currentUser &&
                      (review.userId === currentUser.uid ||
                        userProfile?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 text-dark-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-3 text-dark-300 text-sm leading-relaxed ps-13">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
