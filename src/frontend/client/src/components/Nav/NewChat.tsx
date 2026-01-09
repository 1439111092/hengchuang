import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { icons } from '~/components/Chat/Menus/Endpoints/Icons';
import ConvoIconURL from '~/components/Endpoints/ConvoIconURL';
import { useGetBsConfig, useGetEndpointsQuery } from '~/data-provider';
import type { TConversation, TMessage } from '~/data-provider/data-provider/src';
import { Constants, QueryKeys } from '~/data-provider/data-provider/src';
import { useLocalize, useNewConvo } from '~/hooks';
import store from '~/store';
import { getEndpointField, getIconEndpoint, getIconKey } from '~/utils';
import { Button } from '../ui';
import AppsIcon from '../ui/icon/Apps';

const NewChatButtonIcon = ({ conversation }: { conversation: TConversation | null }) => {
  const searchQuery = useRecoilValue(store.searchQuery);
  const { data: endpointsConfig } = useGetEndpointsQuery();

  if (searchQuery) {
    return (
      <div className="shadow-stroke relative flex h-7 w-7 items-center justify-center rounded-full bg-white text-black dark:bg-white">
        <Search className="h-5 w-5" />
      </div>
    );
  }

  let { endpoint = '' } = conversation ?? {};
  const iconURL = conversation?.iconURL ?? '';
  endpoint = getIconEndpoint({ endpointsConfig, iconURL, endpoint });

  const endpointType = getEndpointField(endpointsConfig, endpoint, 'type');
  const endpointIconURL = getEndpointField(endpointsConfig, endpoint, 'iconURL');
  const iconKey = getIconKey({ endpoint, endpointsConfig, endpointType, endpointIconURL });
  const Icon = icons[iconKey];

  return (
    <div className="h-7 w-7 flex-shrink-0">
      {iconURL && iconURL.includes('http') ? (
        <ConvoIconURL
          iconURL={iconURL}
          modelLabel={conversation?.chatGptLabel ?? conversation?.modelLabel ?? ''}
          endpointIconURL={iconURL}
          context="nav"
        />
      ) : (
        <div className="shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-black">
          {endpoint && Icon != null && (
            <Icon
              size={41}
              context="nav"
              className="h-2/3 w-2/3"
              endpoint={endpoint}
              endpointType={endpointType}
              iconURL={endpointIconURL}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
}: {
  index?: number;
  toggleNav: () => void;
  subHeaders?: React.ReactNode;
  isSmallScreen: boolean;
}) {
  const queryClient = useQueryClient();
  /** Note: this component needs an explicit index passed if using more than one */
  const { newConversation: newConvo } = useNewConvo(index);
  const { data: bsConfig } = useGetBsConfig()

  const navigate = useNavigate();
  const localize = useLocalize();

  const { conversation } = store.useCreateConversationAtom(index);

  const clickHandler = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && !(event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      newConvo();
      navigate('/c/new');
      toggleNav();
      queryClient.setQueryData<TMessage[]>(
        [QueryKeys.messages, conversation?.conversationId ?? Constants.NEW_CONVO],
        [],
      );
    }
  };

  return (
    <div className="sticky left-0 right-0 top-0 z-50 bg-[#F9FBFF]">
      <div className="pb-0.5 last:pb-0" style={{ transform: 'none' }}>
        <div className="mb-3 px-3 pt-3 pb-2">
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(249, 251, 255, 1) 100%)',
              border: '1px solid rgba(229, 231, 235, 0.8)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
            }}
          >
            {bsConfig?.sidebarIcon.image && (
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)',
                  padding: '6px',
                }}
              >
                <img 
                  className='w-full h-full object-contain' 
                  src={__APP_ENV__.BASE_URL + bsConfig?.sidebarIcon.image}
                  alt="Logo"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  }}
                />
              </div>
            )}
            <div 
              className='flex-1 min-w-0'
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '15.5px',
                fontWeight: 600,
                color: 'rgba(17, 24, 39, 0.95)',
                letterSpacing: '0.01em',
                lineHeight: '1.5',
              }}
            >
              {bsConfig?.sidebarSlogan || '恒创智能体聊天助手'}
            </div>
          </div>
        </div>
        <div className='flex w-full px-3' style={{ gap: '6px' }}>
          <Button 
            variant="outline" 
            className='shadow-sm h-10 rounded-xl px-3 flex-1'
            style={{ minWidth: 0, flex: '1 1 0%' }}
            onClick={() => {
              navigate('/apps');
            }}
          >
            <AppsIcon />
            <span className="text-sm font-normal whitespace-nowrap ml-0.5">{localize('com_nav_app_center')}</span>
          </Button>
          {/* 新建btn */}
          <Button
            variant="outline"
            className="shadow-sm h-10 rounded-xl px-3 flex-1"
            style={{ minWidth: 0, flex: '1 1 0%' }}
            aria-label={localize('com_ui_new_chat')}
            onClick={() => {
              document.getElementById("create-convo-btn")?.click();
              // hack
              setTimeout(() => {
                document.getElementById("create-convo-btn")?.click();
              }, 300);
            }}
          >
            <img className='size-[18px] grayscale' src={__APP_ENV__.BASE_URL + '/assets/chat2.png'} alt="" />
            <span className="text-sm font-normal whitespace-nowrap ml-0.5">{localize('com_nav_start_new_chat')}</span>
          </Button>
        </div>
      </div>
      <div id="create-convo-btn" className='opacity-0' onClick={clickHandler}></div>
      {subHeaders != null ? subHeaders : null}
    </div>
  );
}
