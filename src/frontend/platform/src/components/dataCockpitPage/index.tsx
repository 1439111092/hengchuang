import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';

interface KnowledgeBaseFileCardProps {
  fileCount: number;
  title: string;
}

const KnowledgeBaseFileCard: React.FC<KnowledgeBaseFileCardProps> = ({ fileCount, title }) => {
  const [displayCount, setDisplayCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 数字滚动动画
  useEffect(() => {
    setIsVisible(true);
    const duration = 1500; // 动画持续时间
    const steps = 60; // 动画步数
    const increment = fileCount / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayCount(Math.min(Math.floor(increment * currentStep), fileCount));
      } else {
        setDisplayCount(fileCount);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [fileCount]);

  return (
    <div className="group relative bg-gradient-to-br from-sky-900/30 via-slate-900/40 to-indigo-900/30 p-6 rounded-xl border border-sky-500/40 backdrop-blur-md shadow-[0_8px_32px_rgba(14,165,233,0.2)] hover:shadow-[0_12px_48px_rgba(14,165,233,0.35)] transition-all duration-500 hover:border-sky-400/60 hover:scale-[1.02] overflow-hidden">
      {/* 背景光效 */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/0 via-sky-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* 装饰性光点 */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-sky-400 rounded-full opacity-60 animate-pulse" />
      <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* 内容区域 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* 图标装饰 */}
        <div className="mb-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
          <FileText className="w-8 h-8 text-sky-300 group-hover:text-sky-200 transition-colors duration-300" />
        </div>
        
        {/* 数字显示 */}
        <div className="relative mb-4">
          <div className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-sky-50 via-sky-100 to-indigo-100 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]">
            {displayCount.toLocaleString()}
          </div>
          {/* 数字光晕效果 */}
          <div className="absolute inset-0 text-5xl sm:text-6xl font-bold text-sky-400/20 blur-xl -z-10">
            {displayCount.toLocaleString()}
          </div>
        </div>
        
        {/* 标题 */}
        <div className="text-sm sm:text-base text-sky-100/90 text-center leading-relaxed px-2 group-hover:text-sky-50 transition-colors duration-300">
          {title}
        </div>
        
        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {/* 边框光效动画 */}
      <div className="absolute inset-0 rounded-xl border-2 border-sky-400/0 group-hover:border-sky-400/30 transition-all duration-500 pointer-events-none" />
    </div>
  );
};

export default KnowledgeBaseFileCard;

