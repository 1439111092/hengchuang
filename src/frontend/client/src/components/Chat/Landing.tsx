import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

declare const __APP_ENV__: {
  BASE_URL: string;
};
import { useAgentsMapContext, useAssistantsMapContext, useChatContext } from '~/Providers';
import {
  useGetAssistantDocsQuery,
  useGetBsConfig,
  useGetEndpointsQuery,
  useGetStartupConfig,
} from '~/data-provider';
import type * as t from '~/data-provider/data-provider/src';
import { Constants, EModelEndpoint } from '~/data-provider/data-provider/src';
import { useLocalize, useSubmitMessage } from '~/hooks';
import { cn, getEntity, getIconEndpoint } from '~/utils';
import { useInterruptAudio } from '../Voice/textToSpeechStore';
import ConvoStarter from './ConvoStarter';
import SegmentSelector from './SegmentSelector';
import { KnowledgeBasePopover } from './KnowledgeBasePopover';
import { ModelPopover } from './ModelPopover';
import { TeamPopover } from './TeamPopover';

export default function Landing({ Header, isNew, lingsi, setLingsi, chatForm }: { Header?: ReactNode; isNew?: boolean, lingsi: boolean, setLingsi: (value: boolean) => void, chatForm?: ReactNode }) {
  const { conversation } = useChatContext();
  const agentsMap = useAgentsMapContext();
  const assistantMap = useAssistantsMapContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { data: bsConfig } = useGetBsConfig()
  const interruptAudio = useInterruptAudio()
  const [knowledgeBasePopoverOpen, setKnowledgeBasePopoverOpen] = useState(false);
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);

  const localize = useLocalize();

  let { endpoint = '' } = conversation ?? {};

  if (
    endpoint === EModelEndpoint.chatGPTBrowser ||
    endpoint === EModelEndpoint.azureOpenAI ||
    endpoint === EModelEndpoint.gptPlugins
  ) {
    endpoint = EModelEndpoint.openAI;
  }

  const iconURL = conversation?.iconURL;
  endpoint = getIconEndpoint({ endpointsConfig, iconURL, endpoint });
  const { data: documentsMap = new Map() } = useGetAssistantDocsQuery(endpoint, {
    select: (data) => new Map(data.map((dbA) => [dbA.assistant_id, dbA])),
  });

  const { entity, isAgent, isAssistant } = getEntity({
    endpoint,
    agentsMap,
    assistantMap,
    agent_id: conversation?.agent_id,
    assistant_id: conversation?.assistant_id,
  });

  const name = entity?.name ?? '';
  const description = entity?.description ?? '';
  const avatar = isAgent
    ? ((entity as t.Agent | undefined)?.avatar?.filepath ?? '')
    : (((entity as t.Assistant | undefined)?.metadata?.avatar as string | undefined) ?? '');
  const conversation_starters = useMemo(() => {
    /* The user made updates, use client-side cache, or they exist in an Agent */
    if (entity && (entity.conversation_starters?.length ?? 0) > 0) {
      return entity.conversation_starters;
    }
    if (isAgent) {
      return entity?.conversation_starters ?? [];
    }

    /* If none in cache, we use the latest assistant docs */
    const entityDocs = documentsMap.get(entity?.id ?? '');
    return entityDocs?.conversation_starters ?? [];
  }, [documentsMap, isAgent, entity]);

  const containerClassName =
    'shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-black';

  const { submitMessage } = useSubmitMessage();
  const sendConversationStarter = (text: string) => submitMessage({ text });

  const getWelcomeMessage = () => {
    const greeting = conversation?.greeting ?? '';
    if (greeting) {
      return greeting;
    }

    if (isAssistant) {
      return localize('com_nav_welcome_assistant');
    }

    if (isAgent) {
      return localize('com_nav_welcome_agent');
    }

    return typeof startupConfig?.interface?.customWelcome === 'string'
      ? startupConfig?.interface?.customWelcome
      : localize('com_nav_welcome_message');
  };


  return (
    <div className={cn('relative', !isNew && 'h-full')}>
      <div className="absolute left-0 right-0 z-10">{Header != null ? Header : null}</div>
      
      {/* 日常模式时显示公司图片作为背景 */}
      {!lingsi && (
        <div className="absolute top-0 left-0 right-0 w-full overflow-hidden" style={{ height: '50vh', minHeight: '350px', zIndex: 0 }}>
          <div className="relative w-full h-full">
            <img 
              className="w-full h-full object-cover animate-fade-in" 
              style={{ animation: 'fadeIn 1s ease-in-out' }}
              src={__APP_ENV__.BASE_URL + '/assets/hc.png'} 
              alt="恒创" 
            />
            {/* 渐变遮罩，让下方内容更易读 */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
          </div>
        </div>
      )}
      
      {/* 添加CSS动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        .animate-rotate-slow {
          animation: rotate 3s linear infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* 主内容区域 */}
      <div className="relative z-10 flex h-full flex-col items-center" style={{ justifyContent: !lingsi ? 'flex-start' : 'center', paddingTop: !lingsi ? '50vh' : 0 }}>
        <div className="w-full max-w-5xl px-4 py-6 flex flex-col" style={{ minHeight: !lingsi ? 'calc(100vh - 50vh)' : 'auto' }}>
          {/* 欢迎消息区域 */}
          <div className="text-center mb-6 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className={cn('flex items-center justify-center gap-4 mb-3')}>
              {bsConfig?.assistantIcon.image && (
                <img 
                  className="w-12 h-12 animate-float" 
                  src={__APP_ENV__.BASE_URL + bsConfig?.assistantIcon.image} 
                />
              )}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
                {bsConfig?.welcomeMessage}
              </h2>
            </div>
            <div className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 dark:text-gray-400">
              {bsConfig?.functionDescription}
            </div>
          </div>

          {/* 模式切换 - 放在欢迎消息下方 */}
          <div className='flex justify-center mb-6'>
            <SegmentSelector lingsi={lingsi} onChange={(bl) => {
              setLingsi(bl);
              interruptAudio();
            }} />
          </div>

          {/* 对话框 - 放在模式选择器下方 */}
          {chatForm && (
            <div className="w-full max-w-4xl mx-auto mb-6">
              {chatForm}
            </div>
          )}

          {/* 公司特色功能卡片 - 放在对话框下方 */}
          {!lingsi && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 w-full max-w-5xl mx-auto px-4">
                <ModelPopover 
                  open={modelPopoverOpen}
                  onOpenChange={setModelPopoverOpen}
                >
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" 
                    style={{ animationDelay: '0.4s', opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow group-hover:animate-rotate-slow">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531a3.374 3.374 0 00-1.673-2.83l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">智能AI</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">先进的AI技术，为您提供智能化解决方案</p>
                  </div>
                </ModelPopover>

                <KnowledgeBasePopover 
                  open={knowledgeBasePopoverOpen}
                  onOpenChange={setKnowledgeBasePopoverOpen}
                >
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" 
                    style={{ animationDelay: '0.5s', opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">知识库</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">丰富的知识库资源，快速获取专业信息</p>
                  </div>
                </KnowledgeBasePopover>

                <TeamPopover 
                  open={teamPopoverOpen}
                  onOpenChange={setTeamPopoverOpen}
                >
                  <div 
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" 
                    style={{ animationDelay: '0.6s', opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse-slow">
                        <svg className="w-7 h-7 text-white animate-rotate-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">专业服务</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">专业的服务团队，为您提供全方位支持</p>
                  </div>
                </TeamPopover>
            </div>
          )}

          {/* 公司元素展示区域 - 仅在日常模式显示 */}
          {!lingsi && (
            <>
              {/* 公司核心价值和标语 */}
              <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 animate-slide-up mt-auto" style={{ animationDelay: '0.3s', opacity: 0 }}>
                {/* 公司核心价值 - 左侧 */}
                <div className="flex flex-wrap gap-4 text-sm md:text-base text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse-slow group-hover:animate-pulse"></div>
                    <span className="font-medium group-hover:scale-105 transition-transform">创新技术</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-slow" style={{ animationDelay: '0.2s' }}></div>
                    <span className="font-medium group-hover:scale-105 transition-transform">可靠服务</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse-slow" style={{ animationDelay: '0.4s' }}></div>
                    <span className="font-medium group-hover:scale-105 transition-transform">专业团队</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse-slow" style={{ animationDelay: '0.6s' }}></div>
                    <span className="font-medium group-hover:scale-105 transition-transform">持续优化</span>
                  </div>
                </div>
                {/* 公司标语 - 右侧 */}
                <div className="flex-shrink-0">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 animate-shimmer"></div>
                    <span className="text-white font-bold text-base md:text-lg relative z-10 whitespace-nowrap">恒创智能 · 让AI更简单</span>
                  </div>
                </div>
              </div>

              {/* 引导词 */}
              {conversation_starters.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mb-8 px-4">
                  {conversation_starters
                    .slice(0, Constants.MAX_CONVO_STARTERS)
                    .map((text: string, index: number) => (
                      <ConvoStarter
                        key={index}
                        text={text}
                        onClick={() => sendConversationStarter(text)}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {/* 灵思模式时的引导词 */}
          {lingsi && (
            <div className="flex flex-wrap justify-center gap-3 px-4 mb-8">
              {conversation_starters.length > 0 &&
                conversation_starters
                  .slice(0, Constants.MAX_CONVO_STARTERS)
                  .map((text: string, index: number) => (
                    <ConvoStarter
                      key={index}
                      text={text}
                      onClick={() => sendConversationStarter(text)}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
