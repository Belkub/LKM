/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Mic, 
  MicOff, 
  Search, 
  Loader2, 
  Beaker, 
  Info,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeProduct, type AnalysisResult } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ru-RU';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      await performAnalysis({ mimeType: file.type, data: base64Data });
    };
    reader.readAsDataURL(file);
  };

  const handleTextSearch = async () => {
    if (!input.trim()) return;
    setError(null);
    setResult(null);
    setPreviewUrl(null);
    await performAnalysis(input);
  };

  const performAnalysis = async (data: string | { mimeType: string; data: string }) => {
    setIsAnalyzing(true);
    // Clear previous photo if it's a text search (already handled in handleTextSearch)
    // But if it's an image search, handleFileUpload already sets a new one.
    // To be safe and explicit as per user request:
    if (typeof data === 'string') {
      setPreviewUrl(null);
    }
    
    try {
      const analysisResult = await analyzeProduct(data);
      setResult(analysisResult);
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при анализе.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const kzpmRecommendation = result ? (() => {
    const p = result.mediumPolarity.toLowerCase();
    if (p.includes('очень низкая') || p.includes('низкая')) {
      return 'Соответствующая марка органобентонита КЗПМ: Органобент - реологическая добавка';
    }
    if (p.includes('чуть более полярная') || p.includes('средняя')) {
      return 'Соответствующая марка органобентонита КЗПМ: Органобент - ЛКМ';
    }
    return null;
  })() : null;

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Beaker size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">ChemAnalyzer</h1>
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">Industrial Material Intelligence</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium opacity-70">
            <a href="#" className="hover:opacity-100 transition-opacity">Технологии</a>
            <a href="#" className="hover:opacity-100 transition-opacity">База знаний</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Органобентониты</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-8">
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-light leading-tight text-[#1A1A1A]">
                  Анализ <span className="italic font-serif">химической природы</span> материалов
                </h2>
                <p className="text-lg text-[#1A1A1A]/60 font-light">
                  Загрузите фото этикетки или введите название ЛКМ, смазки или клея для мгновенного анализа и подбора структурирующих добавок.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1A1A1A]/5 space-y-6">
                {/* Image Upload Area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative aspect-video rounded-2xl border-2 border-dashed border-[#1A1A1A]/10 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#5A5A40]/50 hover:bg-[#5A5A40]/5 overflow-hidden",
                    previewUrl && "border-none"
                  )}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-medium flex items-center gap-2">
                          <Upload size={20} /> Изменить фото
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-4 p-6">
                      <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Camera className="text-[#5A5A40]" size={32} />
                      </div>
                      <div>
                        <p className="font-medium text-lg">Загрузить фото этикетки</p>
                        <p className="text-sm opacity-50">Нажмите или перетащите файл</p>
                      </div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>

                <div className="relative flex items-center gap-4">
                  <div className="h-px flex-1 bg-[#1A1A1A]/10"></div>
                  <span className="text-[10px] uppercase tracking-widest opacity-30 font-bold">или</span>
                  <div className="h-px flex-1 bg-[#1A1A1A]/10"></div>
                </div>

                {/* Text/Voice Input */}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
                      placeholder="Название продукта (например, ПФ-115)"
                      className="w-full bg-[#F5F2ED] border-none rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-[#5A5A40]/20 transition-all text-lg"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30" size={20} />
                    <button 
                      onClick={toggleListening}
                      className={cn(
                        "absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors",
                        isListening ? "bg-red-500 text-white animate-pulse" : "text-[#1A1A1A]/30 hover:text-[#5A5A40]"
                      )}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                  </div>
                  <button
                    onClick={handleTextSearch}
                    disabled={isAnalyzing || !input.trim()}
                    className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-medium text-lg shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={24} /> : 'Анализировать'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-700"
                  >
                    <AlertCircle className="shrink-0 mt-0.5" size={20} />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6 bg-white/50 rounded-3xl border border-[#1A1A1A]/5"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-[#5A5A40]/10 rounded-full"></div>
                    <div className="w-24 h-24 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-medium">Идет глубокий анализ...</h3>
                    <p className="text-[#1A1A1A]/50 max-w-xs mx-auto">
                      Нейросеть изучает химический состав и подбирает оптимальные марки органобентонита.
                    </p>
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 size={28} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold">Результаты анализа</h3>
                        <p className="text-sm opacity-50">Сформировано на основе ИИ-анализа</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="p-3 bg-white rounded-2xl border border-[#1A1A1A]/10 hover:bg-[#F5F2ED] transition-colors"
                    >
                      <FileText size={20} />
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-[#1A1A1A]/5 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <ResultItem label="Производитель" value={result.manufacturer} subValue={result.country} icon={<Info size={16} />} />
                      <ResultItem label="Химическая природа" value={result.chemicalNature} icon={<Beaker size={16} />} />
                      <ResultItem label="Назначение" value={result.purpose} icon={<ChevronRight size={16} />} />
                      <ResultItem label="Полярность среды" value={result.mediumPolarity} icon={<Info size={16} />} />
                      <ResultItem label="Природа среды" value={result.mediumChemicalNature} icon={<Info size={16} />} />
                      <ResultItem label="Марки органобентонита" value={result.organobentoniteBrands} highlight />
                    </div>
                    
                    <div className="p-8 bg-[#5A5A40] text-white space-y-6">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">Детальные характеристики добавок</h4>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs opacity-60 mb-1">Тип бентонитовой основы</p>
                            <p className="text-lg font-medium">{result.bentoniteBaseType}</p>
                          </div>
                          <div>
                            <p className="text-xs opacity-60 mb-1">Физ-хим свойства основы</p>
                            <p className="text-sm leading-relaxed opacity-90">{result.bentoniteProperties}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs opacity-60 mb-1">Природа катионного ПАВ</p>
                            <p className="text-lg font-medium">{result.surfactantNature}</p>
                          </div>
                          <div>
                            <p className="text-xs opacity-60 mb-1">Особенности применения</p>
                            <p className="text-sm leading-relaxed opacity-90">{result.applicationNotes}</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-white/10">
                        <p className="text-xs opacity-60 mb-2">Производители органобентонита</p>
                        <p className="text-lg font-medium">{result.organobentoniteManufacturers}</p>
                      </div>

                      {kzpmRecommendation && (
                        <div className="pt-4 mt-4 border-t border-white/10">
                          <p className="text-sm font-bold text-red-400 leading-tight">
                            {kzpmRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-6 bg-white/30 rounded-3xl border border-dashed border-[#1A1A1A]/10">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#1A1A1A]/20">
                    <Beaker size={40} />
                  </div>
                  <p className="text-[#1A1A1A]/40 font-medium text-center max-w-xs">
                    Ожидание входных данных для начала анализа
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#1A1A1A]/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-xs font-medium uppercase tracking-widest">
          <p>© 2026 ChemAnalyzer Intelligence System</p>
          <div className="flex gap-8">
            <a href="#">Конфиденциальность</a>
            <a href="#">Условия</a>
            <a href="#">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ResultItem({ label, value, subValue, icon, highlight }: { label: string; value: string; subValue?: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      "p-8 border-b border-r border-[#1A1A1A]/5 last:border-b-0",
      highlight && "bg-[#F5F2ED]"
    )}>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 font-bold mb-3">
        {icon}
        {label}
      </div>
      <p className={cn(
        "text-xl font-medium leading-tight",
        highlight && "text-[#5A5A40]"
      )}>
        {value}
      </p>
      {subValue && <p className="text-sm opacity-50 mt-1">{subValue}</p>}
    </div>
  );
}
