

import React from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface HeaderSettingsModalProps {
  onClose: () => void;
}

const HeaderSettingsModal: React.FC<HeaderSettingsModalProps> = ({ onClose }) => {
  return null; // This component is deprecated.
};

export default HeaderSettingsModal;