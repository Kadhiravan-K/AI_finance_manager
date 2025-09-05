import React, { useState, useContext } from 'react';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { AppState } from '../types';
import { parseNaturalLanguageCalculation, getCurrencyConversionRate } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { currencies, getCurrencyFormatter }from '../utils/currency';
import CustomSelect from './CustomSelect';

type CalculatorType = 'basic' | 'currency' | 'emi' | 'sip' | 'goal' | 'swp';

interface CalculatorScreenProps {
  appState: AppState;
}

const inputBaseClasses = "w-full input-base p-2 rounded-lg no-spinner text-right";
const labelBaseClasses = "block text-sm font-medium text-secondary mb-1";
const resultCardBaseClasses = "p-4 bg-subtle rounded-lg space-y-2 text-center";

interface BasicCalculatorProps {
  appState: AppState;
}

const BasicCalculator: React.FC<BasicCalculatorProps> = ({ appState }) => {
    const [expression, setExpression] = useState('');
    const [result, setResult] = useState('');
    const [history, setHistory] = useState<{ query: string; answer: string }[]>([]);
    const [aiQuery, setAiQuery] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const formatCurrency = useCurrencyFormatter();

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
            let sanitized = expression.replace(/[^-()\d/*+.^sqrt]/g, '');
            sanitized = sanitized.replace(/\^/g, '**');
            sanitized = sanitized.replace(/sqrt\(/g, 'Math.sqrt(');
            
            // eslint-disable-next-line no-new-func
            const calculatedResult = new Function('return ' + sanitized)();
            const resultStr = String(calculatedResult);
            setResult(resultStr);
            setHistory(prev => [{ query: expression, answer: resultStr }, ...prev].slice(0, 10));
        } catch (error) {
            setResult('Error');
        }
    };
    
    const handleAiCalculate = async () => {
        if (!aiQuery.trim()) return;
        setIsAiLoading(true);
        try {
            const res = await parseNaturalLanguageCalculation(appState, aiQuery);
            const answerStr = `${formatCurrency(res.answer)} (${res.explanation})`;
            setHistory(prev => [{ query: aiQuery, answer: answerStr }, ...prev].slice(0, 10));
            setAiQuery('');
        } catch (error) {
            setHistory(prev => [{ query: aiQuery, answer: `Error: ${error instanceof Error ? error.message : 'Calculation failed'}`}, ...prev]);
        }
        setIsAiLoading(false);
    };

    const CalcButton = ({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
        <button onClick={onClick} className={`calc-btn ${className}`}>
            {children}
        </button>
    );

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
        <div className="space-y-3">
            <div className="p-3 bg-subtle rounded-lg space-y-2">
                <div className="relative">
                    <input type="text" value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Ask AI: 'food spending last month'" className="w-full input-base p-2 rounded-full pr-10" />
                    <button onClick={handleAiCalculate} disabled={isAiLoading} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-full bg-violet-500 text-white">
                        {isAiLoading ? <LoadingSpinner/> : '✨'}
                    </button>
                </div>
                <div className="calculator-history pr-2">
                    {history.map((item, i) => <div key={i}><p className="truncate">{item.query}</p><p className="font-semibold text-primary truncate">= {item.answer}</p></div>)}
                </div>
            </div>
            <div className="calculator-result text-right p-4 space-y-1">
                <div className="text-secondary text-lg h-6 truncate" aria-live="polite">{expression || '0'}</div>
                <div className="text-primary text-4xl font-bold h-12 truncate" aria-live="polite">{result}</div>
            </div>
             <div className="grid grid-cols-4 gap-2">
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

                <CalcButton onClick={() => handleButtonClick('0')} className="col-span-2">0</CalcButton>
                <CalcButton onClick={() => handleButtonClick('.')}>.</CalcButton>
                <CalcButton onClick={() => handleButtonClick('=')} className="calc-btn-operator">=</CalcButton>
            </div>
        </div>
    );
  };
  
interface CurrencyCalculatorProps {
  appState: AppState;
}

const CurrencyCalculator: React.FC<CurrencyCalculatorProps> = ({ appState }) => {
    const { settings } = appState;
    const [fromAmount, setFromAmount] = useState('1');
    const [fromCurrency, setFromCurrency] = useState(settings.currency);
    const [toCurrency, setToCurrency] = useState(currencies.find(c => c.code !== settings.currency)?.code || 'USD');
    const [rate, setRate] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fromFormatter = getCurrencyFormatter(fromCurrency);
    const toFormatter = getCurrencyFormatter(toCurrency);

    const handleConvert = async () => {
        setIsLoading(true);
        setRate(null);
        try {
            const fetchedRate = await getCurrencyConversionRate(fromCurrency, toCurrency);
            setRate(fetchedRate);
        } catch (error) {
            console.error(error);
            alert("Could not fetch conversion rate.");
        }
        setIsLoading(false);
    };

    const toAmount = rate ? (parseFloat(fromAmount) || 0) * rate : 0;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelBaseClasses}>Amount</label><input type="text" inputMode="decimal" value={fromAmount} onChange={e => setFromAmount(e.target.value)} className={inputBaseClasses} /></div>
                <div><label className={labelBaseClasses}>From</label><CustomSelect value={fromCurrency} onChange={setFromCurrency} options={currencies.map(c => ({value: c.code, label: c.code}))}/></div>
            </div>
            <div className="text-center"><button onClick={handleConvert} disabled={isLoading} className="button-secondary p-3 rounded-full">{isLoading ? <LoadingSpinner/> : '↓'}</button></div>
            <div><label className={labelBaseClasses}>To</label><CustomSelect value={toCurrency} onChange={setToCurrency} options={currencies.map(c => ({value: c.code, label: c.code}))}/></div>
            {rate && <div className={resultCardBaseClasses}><p className="text-sm text-secondary">Result</p><p className="text-2xl font-bold text-primary">{fromFormatter.format(parseFloat(fromAmount) || 0)} = {toFormatter.format(toAmount)}</p><p className="text-xs text-tertiary">Rate: 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</p></div>}
        </div>
    );
};

const EMICalculator = () => {
    const [principal, setPrincipal] = useState('');
    const [rate, setRate] = useState('');
    const [tenure, setTenure] = useState(''); // in years
    const [result, setResult] = useState<{emi: number, totalInterest: number, totalPayment: number} | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const calculate = () => {
        const P = parseFloat(principal);
        const R = parseFloat(rate) / 12 / 100;
        const N = parseFloat(tenure) * 12;
        if (P > 0 && R > 0 && N > 0) {
            const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
            const totalPayment = emi * N;
            const totalInterest = totalPayment - P;
            setResult({ emi, totalInterest, totalPayment });
        }
    };

    return (
        <div className="space-y-4">
            <div><label className={labelBaseClasses}>Loan Amount (Principal)</label><input type="text" inputMode="decimal" value={principal} onChange={e => setPrincipal(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Annual Interest Rate (%)</label><input type="text" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Loan Tenure (Years)</label><input type="text" inputMode="decimal" value={tenure} onChange={e => setTenure(e.target.value)} className={inputBaseClasses} /></div>
            <button onClick={calculate} className="button-primary w-full py-2">Calculate EMI</button>
            {result && <div className={resultCardBaseClasses}><p className="text-sm text-secondary">Monthly EMI</p><p className="text-2xl font-bold text-primary">{formatCurrency(result.emi)}</p><div className="flex justify-around text-xs pt-2 border-t border-divider"><p>Total Interest:<br/>{formatCurrency(result.totalInterest)}</p><p>Total Payment:<br/>{formatCurrency(result.totalPayment)}</p></div></div>}
        </div>
    );
};

const SIPCalculator = () => {
    const [monthly, setMonthly] = useState('');
    const [rate, setRate] = useState('');
    const [period, setPeriod] = useState(''); // in years
    const [result, setResult] = useState<{invested: number, returns: number, total: number} | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const calculate = () => {
        const P = parseFloat(monthly);
        const i = parseFloat(rate) / 100 / 12;
        const n = parseFloat(period) * 12;
        if (P > 0 && i > 0 && n > 0) {
            const total = P * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
            const invested = P * n;
            const returns = total - invested;
            setResult({ invested, returns, total });
        }
    };

    return (
        <div className="space-y-4">
            <div><label className={labelBaseClasses}>Monthly Investment</label><input type="text" inputMode="decimal" value={monthly} onChange={e => setMonthly(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Expected Annual Return (%)</label><input type="text" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Investment Period (Years)</label><input type="text" inputMode="decimal" value={period} onChange={e => setPeriod(e.target.value)} className={inputBaseClasses} /></div>
            <button onClick={calculate} className="button-primary w-full py-2">Calculate Future Value</button>
            {result && <div className={resultCardBaseClasses}><p className="text-sm text-secondary">Total Value</p><p className="text-2xl font-bold text-primary">{formatCurrency(result.total)}</p><div className="flex justify-around text-xs pt-2 border-t border-divider"><p>Invested:<br/>{formatCurrency(result.invested)}</p><p>Est. Returns:<br/>{formatCurrency(result.returns)}</p></div></div>}
        </div>
    );
};

// Fix: Add SWPCalculator component
const SWPCalculator = () => {
    const [principal, setPrincipal] = useState('');
    const [withdrawal, setWithdrawal] = useState('');
    const [rate, setRate] = useState('');
    const [result, setResult] = useState<{ years: number, months: number, totalWithdrawal: number } | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const calculate = () => {
        const P = parseFloat(principal);
        const W = parseFloat(withdrawal);
        const annualRate = parseFloat(rate);
        
        if (P > 0 && W > 0 && annualRate > 0) {
            const r = annualRate / 100 / 12; // monthly interest rate
            
            if (W <= P * r) {
                setResult(null);
                alert("Your withdrawal amount is less than or equal to the interest earned per month. Your money will never run out!");
                return;
            }
            
            const n_months = Math.log(W / (W - P * r)) / Math.log(1 + r);
            
            if (isFinite(n_months) && n_months > 0) {
                const years = Math.floor(n_months / 12);
                const months = Math.round(n_months % 12);
                const totalWithdrawal = W * n_months;
                setResult({ years, months, totalWithdrawal });
            } else {
                setResult(null);
            }
        } else {
            setResult(null);
        }
    };

    return (
        <div className="space-y-4">
            <div><label className={labelBaseClasses}>Total Investment</label><input type="text" inputMode="decimal" value={principal} onChange={e => setPrincipal(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Monthly Withdrawal</label><input type="text" inputMode="decimal" value={withdrawal} onChange={e => setWithdrawal(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Expected Annual Return (%)</label><input type="text" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} className={inputBaseClasses} /></div>
            <button onClick={calculate} className="button-primary w-full py-2">Calculate SWP Duration</button>
            {result && <div className={resultCardBaseClasses}><p className="text-sm text-secondary">Your funds will last for</p><p className="text-2xl font-bold text-primary">{result.years} years and {result.months} months</p><div className="flex justify-around text-xs pt-2 border-t border-divider"><p>Total Withdrawn:<br/>{formatCurrency(result.totalWithdrawal)}</p></div></div>}
        </div>
    );
};

const GoalCalculator = () => {
    const [target, setTarget] = useState('');
    const [rate, setRate] = useState('');
    const [period, setPeriod] = useState(''); // in years
    const [result, setResult] = useState<{monthly: number} | null>(null);
    const formatCurrency = useCurrencyFormatter();

    const calculate = () => {
        const FV = parseFloat(target);
        const i = parseFloat(rate) / 100 / 12;
        const n = parseFloat(period) * 12;
        if (FV > 0 && i > 0 && n > 0) {
            const monthly = FV / ((((Math.pow(1 + i, n) - 1) / i) * (1 + i)));
            setResult({ monthly });
        }
    };

    return (
        <div className="space-y-4">
            <div><label className={labelBaseClasses}>Target Amount</label><input type="text" inputMode="decimal" value={target} onChange={e => setTarget(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Expected Annual Return (%)</label><input type="text" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} className={inputBaseClasses} /></div>
            <div><label className={labelBaseClasses}>Investment Period (Years)</label><input type="text" inputMode="decimal" value={period} onChange={e => setPeriod(e.target.value)} className={inputBaseClasses} /></div>
            <button onClick={calculate} className="button-primary w-full py-2">Calculate Monthly Investment</button>
            {result && <div className={resultCardBaseClasses}><p className="text-sm text-secondary">Required Monthly Investment</p><p className="text-2xl font-bold text-primary">{formatCurrency(result.monthly)}</p></div>}
        </div>
    );
};

const CalculatorScreen: React.FC<CalculatorScreenProps> = ({ appState }) => {
  const [activeTab, setActiveTab] = useState<CalculatorType>('basic');

  const TabButton = ({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) => (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors w-full ${active ? 'bg-emerald-500 text-white' : 'bg-subtle text-primary hover-bg-stronger'}`}>
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
       <div className="p-4 border-b border-divider flex-shrink-0">
         <h2 className="text-2xl font-bold text-primary text-center">Calculator 🧮</h2>
       </div>
       <div className="flex-shrink-0 p-2 overflow-x-auto border-b border-divider">
         <div className="flex items-center gap-2">
           <TabButton active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}>Basic</TabButton>
           <TabButton active={activeTab === 'currency'} onClick={() => setActiveTab('currency')}>Currency</TabButton>
           <TabButton active={activeTab === 'emi'} onClick={() => setActiveTab('emi')}>EMI</TabButton>
           <TabButton active={activeTab === 'sip'} onClick={() => setActiveTab('sip')}>SIP</TabButton>
           <TabButton active={activeTab === 'swp'} onClick={() => setActiveTab('swp')}>SWP</TabButton>
           <TabButton active={activeTab === 'goal'} onClick={() => setActiveTab('goal')}>Goal</TabButton>
         </div>
       </div>
       <div className="flex-grow overflow-y-auto p-4">
         {activeTab === 'basic' && <BasicCalculator appState={appState} />}
         {activeTab === 'currency' && <CurrencyCalculator appState={appState} />}
         {activeTab === 'emi' && <EMICalculator />}
         {activeTab === 'sip' && <SIPCalculator />}
         {activeTab === 'swp' && <SWPCalculator />}
         {activeTab === 'goal' && <GoalCalculator />}
       </div>
    </div>
  );
};

export default CalculatorScreen;