import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/Popover';
import { Users } from 'lucide-react';

interface TeamMember {
  role: string;
  name: string;
}

interface TeamPopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const teamMembers: TeamMember[] = [
  { role: '前端', name: '吴航' },
  { role: '后端', name: '张磊' },
  { role: '产品经理', name: '江会华' },
];

export function TeamPopover({ children, open, onOpenChange }: TeamPopoverProps) {
  const [isHovering, setIsHovering] = useState(false);

  // 当鼠标离开弹出层和触发器时，延迟关闭
  useEffect(() => {
    if (!isHovering && open) {
      const timer = setTimeout(() => {
        onOpenChange?.(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isHovering, open, onOpenChange]);

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
        className="w-50 max-h-[400px] overflow-y-auto p-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl"
        align="end"
        side="right"
        sideOffset={8}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">专业服务团队</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">为您提供全方位支持</p>
        </div>
        
        <div className="p-1.5">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:bg-purple-50/80 dark:hover:bg-purple-900/20 hover:shadow-sm"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                  <span className="text-gray-500 dark:text-gray-400">{member.role}：</span>
                  <span className="ml-1">{member.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

