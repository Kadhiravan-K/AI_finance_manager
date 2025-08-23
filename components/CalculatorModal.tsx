import React, { useState } from 'react';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';

type CalculatorType = 'basic' | 'emi' | 'sip' | 'goal';

const CalculatorScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalculatorType>('basic');
  const formatCurrency = useCurrencyFormatter();

  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  const BasicCalculator = () => {
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
            // Sanitize by removing anything not a digit, operator, or parenthesis
            const sanitized = expression.replace(/[^-()\d/*+.]/g, '');
            // Using Function constructor is safer than direct eval
            const calculatedResult = new Function('return ' + sanitized)();
            setResult(String(calculatedResult));
        } catch (error) {
            setResult('Error');
        }
    };
    
    const CalcButton = ({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
        <button onClick={onClick} className={`calc-btn ${className}`}>
            {children}
        </button>
    );

    const buttons = ['C', '%', 'DEL', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '00', '.', '='];

    const getButtonClass = (btn: string) => {
        if (['/', '*', '-', '+', '='].includes(btn)) return 'calc-btn-operator';
        if (['C', 'DEL', '%'].includes(btn)) return 'calc-btn-special';
        return '';
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
    
    return (
        <div className="space-y-4">
            <div className="calculator-result text-right p-4 space-y-1">
                <div className="text-secondary text-lg h-6 truncate" aria-live="polite">{expression || '0'}</div>
                <div className="text-primary text-4xl font-bold h-12 truncate" aria-live="polite">{result}</div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {buttons.map(btn => (
                    <CalcButton key={btn} onClick={() => handleButtonClick(btn)} className={getButtonClass(btn)}>
                        {btn}
                    </CalcButton>
                ))}
            </div>
        </div>
    );
  }

  const EMICalculator = () => {
    const [principal, setPrincipal] = useState('');
    const [rate, setRate] = useState('');
    const [tenure, setTenure] = useState('');
    const [result, setResult] = useState<{ emi: number; totalInterest: number; totalPayment: number } | null>(null);

    const calculate = () => {
      const p = parseFloat(principal);
      const r = parseFloat(rate) / 12 / 100;
      const n = parseFloat(tenure) * 12;
      if (p > 0 && r > 0 && n > 0) {
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const totalPayment = emi * n;
        const totalInterest = totalPayment - p;
        setResult({ emi, totalInterest, totalPayment });
      } else {
        setResult(null);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="text-secondary text-sm">Loan Amount</label>
          <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="e.g., 500000" className="calculator-input no-spinner" />
        </div>
        <div>
          <label className="text-secondary text-sm">Annual Interest Rate (%)</label>
          <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g., 8.5" className="calculator-input no-spinner" />
        </div>
        <div>
          <label className="text-secondary text-sm">Loan Tenure (Years)</label>
          <input type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="e.g., 5" className="calculator-input no-spinner" />
        </div>
        <button onClick={calculate} className="button-primary w-full py-2">Calculate EMI</button>
        {result && (
          <div className="calculator-result text-center space-y-2 animate-fadeInUp">
            <div>
              <p className="text-secondary text-sm">Monthly EMI</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(result.emi)}</p>
            </div>
            <div className="flex justify-around text-sm pt-2 border-t border-divider">
              <div><p className="text-secondary">Principal</p><p className="font-semibold text-primary">{formatCurrency(parseFloat(principal))}</p></div>
              <div><p className="text-secondary">Interest</p><p className="font-semibold text-primary">{formatCurrency(result.totalInterest)}</p></div>
              <div><p className="text-secondary">Total Paid</p><p className="font-semibold text-primary">{formatCurrency(result.totalPayment)}</p></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SIPCalculator = () => {
    const [investment, setInvestment] = useState('');
    const [rate, setRate] = useState('');
    const [tenure, setTenure] = useState('');
    const [result, setResult] = useState<{ invested: number; gains: number; futureValue: number } | null>(null);

    const calculate = () => {
      const p = parseFloat(investment);
      const i = parseFloat(rate) / 100 / 12;
      const n = parseFloat(tenure) * 12;
      if (p > 0 && i > 0 && n > 0) {
        const futureValue = p * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const invested = p * n;
        const gains = futureValue - invested;
        setResult({ invested, gains, futureValue });
      } else {
        setResult(null);
      }
    };

    return (
      <div className="space-y-4">
        <div><label className="text-secondary text-sm">Monthly Investment</label><input type="number" value={investment} onChange={e => setInvestment(e.target.value)} placeholder="e.g., 5000" className="calculator-input no-spinner" /></div>
        <div><label className="text-secondary text-sm">Expected Annual Return (%)</label><input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g., 12" className="calculator-input no-spinner" /></div>
        <div><label className="text-secondary text-sm">Investment Period (Years)</label><input type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="e.g., 10" className="calculator-input no-spinner" /></div>
        <button onClick={calculate} className="button-primary w-full py-2">Calculate Future Value</button>
        {result && (
            <div className="calculator-result text-center space-y-2 animate-fadeInUp">
                <div><p className="text-secondary text-sm">Future Value</p><p className="text-2xl font-bold text-primary">{formatCurrency(result.futureValue)}</p></div>
                <div className="flex justify-around text-sm pt-2 border-t border-divider">
                    <div><p className="text-secondary">Invested</p><p className="font-semibold text-primary">{formatCurrency(result.invested)}</p></div>
                    <div><p className="text-secondary">Gains</p><p className="font-semibold text-primary">{formatCurrency(result.gains)}</p></div>
                </div>
            </div>
        )}
      </div>
    );
  };

  const GoalCalculator = () => {
    const [target, setTarget] = useState('');
    const [rate, setRate] = useState('');
    const [tenure, setTenure] = useState('');
    const [result, setResult] = useState<number | null>(null);

     const calculate = () => {
        const F = parseFloat(target);
        const i = parseFloat(rate) / 100 / 12;
        const n = parseFloat(tenure) * 12;
        if (F > 0 && i > 0 && n > 0) {
            const monthlyInvestment = F / (((Math.pow(1 + i, n) - 1) / i));
            setResult(monthlyInvestment);
        } else {
            setResult(null);
        }
    };

    return (
        <div className="space-y-4">
            <div><label className="text-secondary text-sm">Target Amount</label><input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g., 1000000" className="calculator-input no-spinner" /></div>
            <div><label className="text-secondary text-sm">Expected Annual Return (%)</label><input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g., 12" className="calculator-input no-spinner" /></div>
            <div><label className="text-secondary text-sm">Time to Goal (Years)</label><input type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="e.g., 5" className="calculator-input no-spinner" /></div>
            <button onClick={calculate} className="button-primary w-full py-2">Calculate Monthly Saving</button>
            {result !== null && (
                 <div className="calculator-result text-center animate-fadeInUp">
                    <p className="text-secondary text-sm">Required Monthly Saving</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(result)}</p>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0 bg-subtle">
        <div className="grid grid-cols-4 items-center gap-2 bg-subtle p-1 rounded-full border border-divider">
          <TabButton active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}>Basic</TabButton>
          <TabButton active={activeTab === 'emi'} onClick={() => setActiveTab('emi')}>EMI</TabButton>
          <TabButton active={activeTab === 'sip'} onClick={() => setActiveTab('sip')}>SIP</TabButton>
          <TabButton active={activeTab === 'goal'} onClick={() => setActiveTab('goal')}>Goal</TabButton>
        </div>
      </div>
      <div className="p-6 overflow-y-auto flex-grow">
        {activeTab === 'basic' && <BasicCalculator />}
        {activeTab === 'emi' && <EMICalculator />}
        {activeTab === 'sip' && <SIPCalculator />}
        {activeTab === 'goal' && <GoalCalculator />}
      </div>
    </div>
  );
};

export default CalculatorScreen;