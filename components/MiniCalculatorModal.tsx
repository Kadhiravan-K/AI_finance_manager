import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface MiniCalculatorModalProps {
  onClose: () => void;
  onResult: (result: number) => void;
}

const MiniCalculatorModal: React.FC<MiniCalculatorModalProps> = ({ onClose, onResult }) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handleInput = (value: string) => {
    const isOperator = ['+', '-', '*', '/'].includes(value);
    if (result && !isOperator && value !== '.') {
      setExpression(value);
      setResult('');
    } else if (result && (isOperator || value === '.')) {
      setExpression(result + value);
      setResult('');
    } else {
      setExpression(prev => prev + value);
    }
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
  };

  const handleDelete = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!expression) return;
    try {
      const sanitized = expression.replace(/[^-()\d/*+.]/g, '');
      const calculatedResult = new Function('return ' + sanitized)();
      setResult(String(calculatedResult));
    } catch (error) {
      setResult('Error');
    }
  };
  
  const handleInsert = () => {
      const finalResult = parseFloat(result || expression);
      if (!isNaN(finalResult)) {
          onResult(finalResult);
      }
  };

  const CalcButton = ({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button onClick={onClick} className={`calc-btn ${className}`} style={{ padding: '0.75rem' }}>{children}</button>
  );

  const buttons = ['7','8','9','/','4','5','6','*','1','2','3','-','0','.','+'];

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-xs p-0 border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Calculator" onClose={onClose} />
        <div className="p-4 space-y-3">
            <div className="calculator-result text-right p-2 space-y-1">
            <div className="text-secondary text-sm h-5 truncate" aria-live="polite">{expression || '0'}</div>
            <div className="text-primary text-2xl font-bold h-8 truncate" aria-live="polite">{result}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <CalcButton onClick={handleClear} className="calc-btn-special col-span-2">C</CalcButton>
                <CalcButton onClick={handleDelete} className="calc-btn-special">DEL</CalcButton>
                <CalcButton onClick={() => handleInput('/')} className="calc-btn-operator">/</CalcButton>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <CalcButton onClick={() => handleInput('7')}>7</CalcButton>
                <CalcButton onClick={() => handleInput('8')}>8</CalcButton>
                <CalcButton onClick={() => handleInput('9')}>9</CalcButton>
                <CalcButton onClick={() => handleInput('*')} className="calc-btn-operator">*</CalcButton>

                <CalcButton onClick={() => handleInput('4')}>4</CalcButton>
                <CalcButton onClick={() => handleInput('5')}>5</CalcButton>
                <CalcButton onClick={() => handleInput('6')}>6</CalcButton>
                <CalcButton onClick={() => handleInput('-')} className="calc-btn-operator">-</CalcButton>

                <CalcButton onClick={() => handleInput('1')}>1</CalcButton>
                <CalcButton onClick={() => handleInput('2')}>2</CalcButton>
                <CalcButton onClick={() => handleInput('3')}>3</CalcButton>
                <CalcButton onClick={() => handleInput('+')} className="calc-btn-operator">+</CalcButton>
                
                <CalcButton onClick={() => handleInput('0')} className="col-span-2">0</CalcButton>
                <CalcButton onClick={() => handleInput('.')}>.</CalcButton>
                <CalcButton onClick={handleCalculate} className="calc-btn-operator">=</CalcButton>
            </div>
            <button onClick={handleInsert} className="button-primary w-full py-2 text-sm">Insert Result</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default MiniCalculatorModal;