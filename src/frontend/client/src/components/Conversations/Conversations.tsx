import { useMemo, memo } from 'react';
import { parseISO, isToday } from 'date-fns';
import { TConversation } from '~/data-provider/data-provider/src';
import { useLocalize, TranslationKeys } from '~/hooks';
import { groupConversationsByDate } from '~/utils';
import Convo from './Convo';

const Conversations = ({
  conversations,
  moveToTop,
  toggleNav,
  searchValue,
}: {
  conversations: Array<TConversation | null>;
  moveToTop: () => void;
  toggleNav: () => void;
  searchValue?: string;
}) => {
  const localize = useLocalize();
  const groupedConversations = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  );
  const firstTodayConvoId = useMemo(
    () =>
      conversations.find((convo) => convo && convo.updatedAt && isToday(parseISO(convo.updatedAt)))
        ?.conversationId,
    [conversations],
  );

  // 检查是否有搜索结果
  const hasSearchValue = searchValue && searchValue.trim().length > 0;
  const hasNoResults = hasSearchValue && groupedConversations.length === 0;

  return (
    <div className="text-token-text-primary flex flex-col pb-4 text-sm">
      {hasNoResults ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-in fade-in duration-300">
          <div 
            className="mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(229, 231, 235, 0.4) 0%, rgba(243, 244, 246, 0.6) 100%)',
            }}
          >
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                color: 'rgba(156, 163, 175, 0.8)',
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <p
            className="mb-2 text-center"
            style={{
              fontSize: '16px',
              color: 'rgba(55, 65, 81, 0.9)',
              fontWeight: 500,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
              letterSpacing: '0.01em',
              lineHeight: '1.5',
            }}
          >
            未找到相关记录
          </p>
          <p
            className="text-center max-w-xs"
            style={{
              fontSize: '13px',
              color: 'rgba(107, 114, 128, 0.75)',
              fontWeight: 400,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
              letterSpacing: '0.01em',
              lineHeight: '1.6',
            }}
          >
            尝试使用其他关键词搜索，或检查拼写是否正确
          </p>
        </div>
      ) : (
        <div>
          <span>
            {groupedConversations.map(([groupName, convos], groupIndex) => (
              <div key={groupName} className="relative">
                {/* 时间分组分隔线 */}
                {groupIndex > 0 && (
                  <div 
                    className="mx-3 my-4"
                    style={{
                      height: '1px',
                      background: 'linear-gradient(to right, transparent, rgba(229, 231, 235, 0.6), transparent)',
                    }}
                  />
                )}
                {/* 时间分组标题 */}
                <div
                  className="relative"
                  style={{
                    marginTop: groupIndex === 0 ? '8px' : '0px',
                    marginBottom: '10px',
                    paddingLeft: '12px',
                    paddingRight: '12px',
                  }}
                >
                  <div
                    className="inline-flex items-center"
                    style={{
                      fontSize: '0.72rem',
                      color: 'rgba(75, 85, 99, 0.85)',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
                      textTransform: 'uppercase',
                    }}
                  >
                    <span
                      className="inline-block mr-2"
                      style={{
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                      }}
                    />
                    {localize(groupName as TranslationKeys) || groupName}
                  </div>
                </div>
                {/* 对话列表 */}
                <div className="space-y-0.5 px-1">
                  {convos.map((convo, i) => (
                    <Convo
                      key={`${groupName}-${convo.conversationId}-${i}`}
                      isLatestConvo={convo.conversationId === firstTodayConvoId}
                      conversation={convo}
                      retainView={moveToTop}
                      toggleNav={toggleNav}
                    />
                  ))}
                </div>
              </div>
            ))}
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(Conversations);
