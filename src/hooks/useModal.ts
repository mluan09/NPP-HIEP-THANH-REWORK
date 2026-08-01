import { useState, useCallback } from 'react';
import type { ModalType } from '../components/ConfirmModal';

export interface ModalState {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  type?: ModalType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showAlert = useCallback(
    (title: string, message: React.ReactNode, type: ModalType = 'info', onConfirm?: () => void) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        showCancel: false,
        confirmText: 'Đóng',
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          if (onConfirm) onConfirm();
        },
      });
    },
    []
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: React.ReactNode,
      onConfirm: () => void,
      options?: {
        type?: ModalType;
        confirmText?: string;
        cancelText?: string;
      }
    ) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: options?.type || 'warning',
        showCancel: true,
        confirmText: options?.confirmText || 'Xác nhận',
        cancelText: options?.cancelText || 'Hủy bỏ',
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          onConfirm();
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
        },
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showAlert,
    showConfirm,
    closeModal,
  };
}
