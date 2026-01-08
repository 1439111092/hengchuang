import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { getKnowledgeInfo } from '~/api/linsight';
import { BookOpen } from 'lucide-react';

interface KnowledgeBase {
  id: number;
  name: string;
  description?: string;
  state?: number;
}

interface KnowledgeBasePopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KnowledgeBasePopover({ children, open, onOpenChange }: KnowledgeBasePopoverProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (open) {
      loadKnowledgeBases();
    }
  }, [open]);

  // 当鼠标离开弹出层和触发器时，延迟关闭
  useEffect(() => {
    if (!isHovering && open) {
      const timer = setTimeout(() => {
        onOpenChange?.(false);
      }, 200); // 200ms 延迟，避免快速移动鼠标时关闭
      return () => clearTimeout(timer);
    }
  }, [isHovering, open, onOpenChange]);

  const loadKnowledgeBases = async () => {
    try {
      setLoading(true);
      const response = await getKnowledgeInfo({ page: 1, name: '', page_size: 200 });
      
      // 处理不同的响应结构
      let knowledgeList: KnowledgeBase[] = [];
      
      if (response) {
        // 如果 response 直接是数组
        if (Array.isArray(response)) {
          knowledgeList = response;
        }
        // 如果 response.data 是数组
        else if (Array.isArray(response.data)) {
          knowledgeList = response.data;
        }
        // 如果 response.data.data 是数组（嵌套结构）
        else if (response.data?.data && Array.isArray(response.data.data)) {
          knowledgeList = response.data.data;
        }
        // 如果 response.data 是对象且包含 data 字段
        else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          const nestedData = (response.data as any).data;
          if (Array.isArray(nestedData)) {
            knowledgeList = nestedData;
          }
        }
      }
      
      // 确保 knowledgeList 是数组
      setKnowledgeBases(Array.isArray(knowledgeList) ? knowledgeList : []);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
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
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/10">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">知识库列表</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">当前可用的知识库</p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
          </div>
        ) : !Array.isArray(knowledgeBases) || knowledgeBases.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <div className="text-xs">暂无知识库</div>
          </div>
        ) : (
          <div className="p-1.5">
            {knowledgeBases.map((kb) => (
              <div
                key={kb.id}
                className={`
                  flex items-start gap-2 p-2 rounded-lg transition-all duration-200
                  hover:bg-green-50/80 dark:hover:bg-green-900/20
                  hover:shadow-sm
                  ${kb.state === 2 || kb.state === 0 ? 'opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center shadow-sm">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
                    {kb.name}
                  </div>
                  {kb.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {kb.description}
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

