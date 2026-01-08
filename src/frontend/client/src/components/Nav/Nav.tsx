import type { ConversationListResponse } from '~/data-provider/data-provider/src';
import { PermissionTypes, Permissions } from '~/data-provider/data-provider/src';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchContext } from '~/Providers';
import { Conversations } from '~/components/Conversations';
import { Spinner } from '~/components/svg';
import { useConversationsInfiniteQuery } from '~/data-provider';
import {
  useAuthContext,
  useHasAccess,
  useLocalStorage,
  useLocalize,
  useMediaQuery,
  useNavScrolling,
} from '~/hooks';
import { cn } from '~/utils';
import AccountSettings from './AccountSettings';
import NavToggle from './NavToggle';
import NewChat from './NewChat';

const Nav = ({
  navVisible,
  setNavVisible,
}: {
  navVisible: boolean;
  setNavVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const localize = useLocalize();
  const { isAuthenticated } = useAuthContext();

  const [navWidth, setNavWidth] = useState(() => {
    const savedWidth = localStorage.getItem('navWidth');
    return savedWidth ? savedWidth : '260px';
  });
  const [isHovering, setIsHovering] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [newUser, setNewUser] = useLocalStorage('newUser', true);
  const [isToggleHovering, setIsToggleHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const hasAccessToBookmarks = useHasAccess({
    permissionType: PermissionTypes.BOOKMARKS,
    permission: Permissions.USE,
  });

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  useEffect(() => {
    if (isSmallScreen) {
      const savedNavVisible = localStorage.getItem('navVisible');
      if (savedNavVisible === null) {
        toggleNavVisible();
      }
      setNavWidth('320px');
    } else {
      // 只在没有保存的宽度时才使用默认值
      const savedWidth = localStorage.getItem('navWidth');
      if (!savedWidth) {
        setNavWidth('260px');
      }
    }
  }, [isSmallScreen]);

  // 拖动调整宽度
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isSmallScreen) return;
      const newWidth = e.clientX;
      // 限制宽度范围：最小180px，最大600px
      if (newWidth >= 180 && newWidth <= 600) {
        const widthStr = `${newWidth}px`;
        setNavWidth(widthStr);
        localStorage.setItem('navWidth', widthStr);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, isSmallScreen]);

  const [showLoading, setShowLoading] = useState(false);

  const { pageNumber, searchQuery, setPageNumber, searchQueryRes } = useSearchContext();
  const [tags, setTags] = useState<string[]>([]);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useConversationsInfiniteQuery(
      {
        pageNumber: pageNumber.toString(),
        isArchived: false,
        tags: tags.length === 0 ? undefined : tags,
      },
      { enabled: isAuthenticated },
    );

  useEffect(() => {
    // When a tag is selected, refetch the list of conversations related to that tag
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags]);
  const { containerRef, moveToTop } = useNavScrolling<ConversationListResponse>({
    setShowLoading,
    hasNextPage: searchQuery ? searchQueryRes?.hasNextPage : hasNextPage,
    fetchNextPage: searchQuery ? searchQueryRes?.fetchNextPage : fetchNextPage,
    isFetchingNextPage: searchQuery
      ? searchQueryRes?.isFetchingNextPage ?? false
      : isFetchingNextPage,
  });

  const conversations = useMemo(
    () =>
      // 初始化列表or搜索数据获取
      (searchQuery ? searchQueryRes?.data : data)?.pages.flatMap((page) => page.conversations) ||
      [],
    [data, searchQuery, searchQueryRes?.data],
  );

  const toggleNavVisible = () => {
    setNavVisible((prev: boolean) => {
      localStorage.setItem('navVisible', JSON.stringify(!prev));
      return !prev;
    });
    if (newUser) {
      setNewUser(false);
    }
  };

  const itemToggleNav = () => {
    if (isSmallScreen) {
      toggleNavVisible();
    }
  };

  return (
    <>
      <div
        ref={navRef}
        data-testid="nav"
        className={
          'nav active max-w-[320px] flex-shrink-0 overflow-x-hidden md:max-w-[600px] bg-[#F9FBFF] relative'
        }
        style={{
          width: navVisible ? navWidth : '0px',
          visibility: navVisible ? 'visible' : 'hidden',
          transition: isDragging ? 'none' : 'width 0.2s, visibility 0.2s',
        }}
      >
        <div className="h-full" style={{ width: navWidth }}>
          <div className="flex h-full min-h-0 flex-col">
            <div
              className={cn(
                'flex h-full min-h-0 flex-col transition-opacity',
                isToggleHovering && !isSmallScreen ? 'opacity-50' : 'opacity-100',
              )}
            >
              <div
                className={cn(
                  'scrollbar-trigger relative h-full w-full flex-1 items-start border-white/20',
                )}
              >
                <nav
                  id="chat-history-nav"
                  aria-label={localize('com_ui_chat_history')}
                  className="flex h-full w-full flex-col px-3 pb-3.5"
                >
                  {/* 新建 */}
                  <NewChat
                    toggleNav={itemToggleNav}
                    isSmallScreen={isSmallScreen}
                  />
                  <div
                    className={cn(
                      '-mr-2 flex-1 flex-col overflow-y-auto pr-2 transition-opacity duration-500',
                      isHovering ? '' : 'scrollbar-transparent',
                    )}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    ref={containerRef}
                  >
                    {/* 会话列表 */}
                    <Conversations
                      conversations={conversations}
                      moveToTop={moveToTop}
                      toggleNav={itemToggleNav}
                    />
                    {(isFetchingNextPage || showLoading) && (
                      <Spinner className={cn('m-1 mx-auto mb-4 h-4 w-4 text-text-primary')} />
                    )}
                  </div>
                  {/* 左下角设置 */}
                  <AccountSettings />
                </nav>
              </div>
            </div>
          </div>
        </div>
        
        {/* 拖动条 */}
        {navVisible && !isSmallScreen && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-20 group"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            style={{
              backgroundColor: isDragging ? '#1890ff' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = 'rgba(24, 144, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {/* 拖动提示 */}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-1 h-12 bg-sky-400/0 group-hover:bg-sky-400/50 rounded-full transition-colors" />
          </div>
        )}
      </div>
      {/* 展开 */}
      <NavToggle
        isHovering={isToggleHovering}
        setIsHovering={setIsToggleHovering}
        onToggle={toggleNavVisible}
        navVisible={navVisible}
        navWidth={navWidth}
        className="fixed left-0 top-1/2 z-40 hidden md:flex"
      />
      {isSmallScreen && (
        <div
          id="mobile-nav-mask-toggle"
          role="button"
          tabIndex={0}
          className={`nav-mask ${navVisible ? 'active' : ''}`}
          onClick={toggleNavVisible}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleNavVisible();
            }
          }}
          aria-label="Toggle navigation"
        />
      )}
    </>
  );
};

export default memo(Nav);
