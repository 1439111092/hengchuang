import { useState, useCallback, useMemo, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TConversation } from '~/data-provider/data-provider/src';
import debounce from 'lodash/debounce';

interface HistorySearchProps {
  conversations: Array<TConversation | null>;
  onFilterChange: (filteredConversations: Array<TConversation | null>) => void;
  onSearchValueChange?: (searchValue: string) => void;
}

const HistorySearch = ({ conversations, onFilterChange, onSearchValueChange }: HistorySearchProps) => {
  const [searchValue, setSearchValue] = useState('');

  // 当对话列表变化时，如果搜索框为空，更新过滤后的列表
  useEffect(() => {
    if (!searchValue.trim()) {
      onFilterChange(conversations);
    }
  }, [conversations, searchValue, onFilterChange]);

  // 过滤对话的函数
  const filterConversations = useCallback(
    (query: string) => {
      if (!query.trim()) {
        onFilterChange(conversations);
        return;
      }

      const lowerQuery = query.toLowerCase().trim();
      const filtered = conversations.filter((convo) => {
        if (!convo) return false;
        const title = convo.title?.toLowerCase() || '';
        return title.includes(lowerQuery);
      });

      onFilterChange(filtered);
    },
    [conversations, onFilterChange],
  );

  // 防抖搜索
  const debouncedFilter = useMemo(
    () => debounce(filterConversations, 300),
    [filterConversations],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchValueChange?.(value);
    debouncedFilter(value);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearchValueChange?.('');
    onFilterChange(conversations);
  };

  return (
    <div className="px-3 mb-3 pt-2 pb-1">
      <Input
        placeholder="搜索历史记录..."
        prefix={<SearchOutlined className="text-gray-400" style={{ fontSize: '14px' }} />}
        value={searchValue}
        onChange={handleChange}
        allowClear
        onClear={handleClear}
        size="middle"
        style={{
          borderRadius: '10px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 400,
          letterSpacing: '0.01em',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          transition: 'all 0.2s ease',
        }}
        className="placeholder:text-gray-400 hover:border-blue-300 focus:border-blue-400 focus:shadow-sm"
      />
    </div>
  );
};

export default HistorySearch;

