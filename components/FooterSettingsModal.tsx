import React, { useContext, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import { SettingsContext } from '../contexts/SettingsContext';
import { ActiveScreen } from '../types';

const modalRoot = document.getElementById('modal-root')!;

interface FooterSettingsModalProps {
  onClose: () => void;
}

const FooterSettingsModal: React.FC<FooterSettingsModalProps> = ({ onClose }) => {
  return null; // This component is deprecated
};

export default FooterSettingsModal;