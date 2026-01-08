import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { Sparkles } from 'lucide-react';
import request from '~/api/request';

interface Model {
  id?: string | number;
  name?: string;
  model_name?: string;
  model_type?: string;
  online?: boolean;
  server_name?: string;
  [key: string]: any;
}

interface ModelPopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ModelPopover({ children, open, onOpenChange }: ModelPopoverProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open]);

  // 当鼠标离开弹出层和触发器时，延迟关闭
  useEffect(() => {
    if (!isHovering && open) {
      const timer = setTimeout(() => {
        onOpenChange?.(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isHovering, open, onOpenChange]);

  const loadModels = async () => {
    try {
      setLoading(true);
      // 使用 /api/v1/llm 获取所有模型列表
      const response = await request.get('/api/v1/llm');
      
      let modelList: Model[] = [];
      
      // 响应结构：数组，每个元素是一个服务器，包含 models 数组
      if (Array.isArray(response?.data)) {
        response.data.forEach((server: any) => {
          if (server.models && Array.isArray(server.models)) {
            server.models.forEach((model: any) => {
              // 只显示在线的模型
              if (model.online && model.model_name) {
                modelList.push({
                  id: model.id,
                  model_name: model.model_name,
                  model_type: model.model_type,
                  server_name: server.name,
                  online: model.online
                });
              }
            });
          }
        });
      }
      
      // 按模型名称排序
      modelList.sort((a, b) => {
        const nameA = a.model_name || '';
        const nameB = b.model_name || '';
        return nameA.localeCompare(nameB);
      });
      
      setModels(modelList);
    } catch (error) {
      console.error('Failed to load models:', error);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const getModelDisplayName = (model: Model): string => {
    return model.model_name || model.name || '未知模型';
  };

  const getModelTypeLabel = (modelType?: string): string => {
    const typeMap: Record<string, string> = {
      'llm': 'LLM',
      'embedding': 'Embedding',
      'asr': 'ASR',
      'tts': 'TTS',
      'rerank': 'Rerank'
    };
    return typeMap[modelType || ''] || modelType || '';
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div
          onMouseEnter={() => {
            setIsHovering(true);
            onOpenChange?.(true);
          }}
          onMouseLeave={() => setIsHovering(false)}
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-70 max-h-[400px] overflow-y-auto p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl"
        align="end"
        side="right"
        sideOffset={8}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">支持的模型</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">系统可用的AI模型列表</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        ) : !Array.isArray(models) || models.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <div className="text-xs">暂无可用模型</div>
          </div>
        ) : (
          <div className="p-1.5">
            {models.map((model, index) => (
              <div
                key={model.id || model.name || index}
                className="flex items-start gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 hover:shadow-sm"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
                    {getModelDisplayName(model)}
                  </div>
                  {model.server_name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {model.server_name}
                      {model.model_type && ` · ${getModelTypeLabel(model.model_type)}`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

