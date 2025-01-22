// src/components/Modal.tsx
import React from 'react';
import './ModalRoutes.css'; 

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export const ModalRoutes: React.FC<ModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Aviso</h2>
        <p>{message}</p>
        <button onClick={onClose} className='btn btn-danger'>Fechar</button>
      </div>
    </div>
  );
};

