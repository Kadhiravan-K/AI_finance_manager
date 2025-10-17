
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
          onClose();
      }
  };
  
  const handleButtonClick = (btn: string) => {
    switch (btn) {
        case 'C': handleClear(); break;
        case 'DEL': handleDelete(); break;
        case '=': handleCalculate(); break;
        case '%': handleInput('/100*'); break;
        default: handleInput(btn);
    }
  };

  const CalcButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
    <button type="button" onClick={onClick} className={`calc-btn ${className}`}>{children}</button>
  );

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[55] p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-[280px] p-0 border border-divider animate-scaleIn flex flex-col" onClick={e => e.stopPropagation()}>
        <ModalHeader title="Calculator" onClose={onClose} />
        <div className="p-4 space-y-3">
            <div className="calculator-result text-right p-2 space-y-1">
                <div className="text-secondary text-sm h-5 truncate" aria-live="polite">{expression || '0'}</div>
                <div className="text-primary text-2xl font-bold h-8 truncate" aria-live="polite">{result}</div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
                <CalcButton onClick={() => handleButtonClick('C')} className="calc-btn-special">C</CalcButton>
                <CalcButton onClick={() => handleButtonClick('DEL')} className="calc-btn-special">DEL</CalcButton>
                <CalcButton onClick={() => handleButtonClick('%')} className="calc-btn-operator">%</CalcButton>
                <CalcButton onClick={() => handleButtonClick('/')} className="calc-btn-operator">÷</CalcButton>

                <CalcButton onClick={() => handleButtonClick('7')}>7</CalcButton>
                <CalcButton onClick={() => handleButtonClick('8')}>8</CalcButton>
                <CalcButton onClick={() => handleButtonClick('9')}>9</CalcButton>
                <CalcButton onClick={() => handleButtonClick('*')} className="calc-btn-operator">×</CalcButton>

                <CalcButton onClick={() => handleButtonClick('4')}>4</CalcButton>
                <CalcButton onClick={() => handleButtonClick('5')}>5</CalcButton>
                <CalcButton onClick={() => handleButtonClick('6')}>6</CalcButton>
                <CalcButton onClick={() => handleButtonClick('-')} className="calc-btn-operator">-</CalcButton>

                <CalcButton onClick={() => handleButtonClick('1')}>1</CalcButton>
                <CalcButton onClick={() => handleButtonClick('2')}>2</CalcButton>
                <CalcButton onClick={() => handleButtonClick('3')}>3</CalcButton>
                <CalcButton onClick={() => handleButtonClick('+')} className="calc-btn-operator">+</CalcButton>
                
                <CalcButton onClick={() => handleButtonClick('00')}>00</CalcButton>
                <CalcButton onClick={() => handleButtonClick('0')}>0</CalcButton>
                <CalcButton onClick={() => handleButtonClick('.')}>.</CalcButton>
                <CalcButton onClick={() => handleButtonClick('=')} className="calc-btn-operator">=</CalcButton>
            </div>
            <button onClick={handleInsert} className="button-primary w-full py-2 text-sm">Insert Result</button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default MiniCalculatorModal;
