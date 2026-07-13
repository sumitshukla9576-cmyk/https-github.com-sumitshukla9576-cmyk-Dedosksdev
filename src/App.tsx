import { useState, useRef } from 'react';
import { UploadCloud, FileText, Presentation, BookOpen, Loader2, FileCheck2, AlertCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { TaskType, AnalysisResponse } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [taskType, setTaskType] = useState<TaskType>('summary');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a document first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('taskType', taskType);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      let data: AnalysisResponse = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error(`Server error (${response.status}): The application encountered an unexpected error. Check the console for details.`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze the document.');
      }

      setResult(data.result || 'No content generated.');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const options = [
    { id: 'summary', icon: BookOpen, label: 'Academic Summary', desc: 'Extract key arguments & methodology', colorClass: 'bg-emerald-50 text-emerald-600' },
    { id: 'report', icon: FileText, label: 'Formal Report', desc: 'Structured findings & executive summary', colorClass: 'bg-indigo-50 text-indigo-600' },
    { id: 'presentation', icon: Presentation, label: 'Presentation Outline', desc: 'Slide-by-slide structure & notes', colorClass: 'bg-amber-50 text-amber-600' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slate-900 rounded-sm flex items-center justify-center">
              <FileCheck2 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">DocuMind</h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Research Analysis Assistant
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Section */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2 tracking-tight text-slate-900">Analyze Document</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Upload your research paper, article, or notes to instantly generate summaries, reports, or presentation outlines.
              </p>

              {/* Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-colors duration-200",
                  file ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-400"
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
                
                {file ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      <FileCheck2 className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <p className="text-xs text-slate-900 font-bold border-b-2 border-slate-900 pb-0.5 mt-2 w-fit mx-auto">Replace Document</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 flex items-center justify-center rounded-full mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Upload research documents</p>
                    <p className="text-xs text-slate-500">PDF, DOCX or TXT up to 50MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Task Selection */}
            <div>
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider mb-4">Output Format</h3>
              <div className="space-y-3">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTaskType(opt.id)}
                    className={cn(
                      "w-full flex items-center text-left p-4 rounded-xl border shadow-sm transition-all duration-200",
                      taskType === opt.id
                        ? "border-slate-900 ring-1 ring-slate-900 bg-white"
                        : "border-slate-100 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mr-4 shrink-0", opt.colorClass)}>
                      <opt.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm mb-0.5">
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing Document...</span>
                </>
              ) : (
                <span>Generate {options.find(o => o.id === taskType)?.label}</span>
              )}
            </button>
            
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start text-sm border border-red-100">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5 text-red-500" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-100 rounded-xl p-10 min-h-[600px] shadow-sm flex flex-col">
              {!result && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-32 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm max-w-[250px] leading-relaxed">
                    Upload a document and select a format to view the AI-generated results here.
                  </p>
                </div>
              ) : isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-32 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-slate-200 rounded-full animate-ping opacity-75"></div>
                    <div className="relative w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-slate-900 animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">Processing Document</p>
                    <p className="text-sm">This may take a few moments...</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <Markdown>{result}</Markdown>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
