'use client';

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-surface border border-primary/20 rounded-xl shadow-2xl max-w-sm w-full p-6 sm:p-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">⚠️</div>
          <h3 className="font-display text-lg sm:text-xl font-semibold text-primary">
            Delete Image?
          </h3>
        </div>

        {/* Message */}
        <p className="text-text-secondary text-sm sm:text-base mb-6 leading-relaxed">
          This image will be permanently deleted from your garden. This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-surface-hover border border-primary/20 text-text-primary rounded-lg font-medium hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-error to-error/90 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-error/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <span>🗑️</span>
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
