"use client"

import { useQueryClient } from '@tanstack/react-query'
import { Search, X } from "lucide-react"
import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import { addToFrequentlyUsed, getChatOnlineApi, removeFromFrequentlyUsed } from "~/api/apps"
import { Input } from "~/components/ui"
import { useDebounce } from '~/components/ui/MultiSelect'
import { useGetBsConfig } from '~/data-provider'
import { ConversationData, QueryKeys } from "~/data-provider/data-provider/src"
import useToast from '~/hooks/useToast'
import { useLocalize } from '~/hooks'
import store from "~/store"
import { addConversation, generateUUID } from "~/utils"
import { AgentGrid } from "./components/AgentGrid"
import { AgentNavigation } from "./components/AgentNavigation"
import { SearchOverlay } from "./components/SearchOverlay"
import { atom } from 'recoil'

export default function AgentCenter() {
    const [searchQuery, setSearchQuery] = useState("")
    const [favorites, setFavorites] = useState<string[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const refreshAgentData = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    const { showToast } = useToast()
    const localize = useLocalize()
    const categoryIdRef = useRef<string>("")

    const handleCategoryChange = (categoryId: string) => {
        console.log("点击的标签ID:", categoryId, "当前搜索状态:", isSearching);

        // 1. 清除搜索状态（如果有）
        const wasSearching = !!searchQuery;
        if (wasSearching) {
            setSearchQuery("");
            setIsSearching(false);
        }
        categoryIdRef.current = categoryId;

        // 2. 定义核心滚动逻辑
        const performScroll = () => {
            if (categoryId === "favorites") {
                // 常用标签：直接滚动到顶部（无需依赖sectionRefs）
                scrollContainerRef.current?.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
                return;
            }

            // 其他标签：通过sectionRefs查找DOM并滚动
            const targetSection = sectionRefs.current[categoryId];
            if (targetSection && scrollContainerRef.current) {
                const containerRect = scrollContainerRef.current.getBoundingClientRect();
                const sectionRect = targetSection.getBoundingClientRect();
                const relativeTop = sectionRect.top - containerRect.top + scrollContainerRef.current.scrollTop;

                scrollContainerRef.current.scrollTo({
                    top: relativeTop - 20,
                    behavior: "smooth"
                });
            } else {
                console.log("未找到目标分区，但已尝试滚动");
            }
        };

        // 3. 分场景处理
        if (!wasSearching) {
            // 场景1：非搜索状态（AgentGrid已渲染）→ 立即滚动
            performScroll();
        } else {
            // 场景2：从搜索状态切换（AgentGrid需要重新渲染）→ 监听DOM变化后滚动
            const container = scrollContainerRef.current;
            if (!container) return;

            // 停止之前的监听（避免重复）
            let observer: MutationObserver | null = null;

            observer = new MutationObserver((mutations, obs) => {
                // 检查目标分区是否已挂载
                const targetExists = categoryId === "favorites"
                    ? true  // 常用标签无需检查DOM
                    : !!sectionRefs.current[categoryId];

                if (targetExists) {
                    performScroll(); // 执行滚动
                    obs.disconnect(); // 完成后断开
                    observer = null;
                }
            });

            // 监听滚动容器的DOM变化（AgentGrid渲染会改变子元素）
            observer.observe(container, {
                childList: true,    // 监听子元素增减
                subtree: true       // 监听所有后代
            });

            // 安全超时：5秒后强制停止监听（防内存泄漏）
            setTimeout(() => {
                if (observer) {
                    observer.disconnect();
                    // 超时后仍尝试一次滚动（极端情况保底）
                    performScroll();
                }
            }, 2000);
        }
    };

    // 修改handleSearchChange函数，实现多页数据加载
    const handleSearchChange = async (query: string) => {
        if (query.trim()) {
            setIsSearching(true);
            setSearchLoading(true);
            let allResults: any[] = []; // 存储所有页的结果
            let currentPage = 1;
            const pageSize = 80; // 每页条数（和接口保持一致）

            try {
                // 循环加载所有页数据
                while (true) {
                    // 调用接口，禁用默认限制（或按实际需要调整）
                    const result = await getChatOnlineApi(
                        currentPage,
                        query,
                        -1,
                        pageSize // 禁用默认限制，或根据接口逻辑调整
                    );

                    const pageData = result.data || [];
                    allResults = [...allResults, ...pageData];

                    // 终止条件：当前页数据不足一页，说明已加载完所有数据
                    if (pageData.length < pageSize) {
                        break;
                    }

                    currentPage++; // 加载下一页
                }

                // 处理可能的id字段映射（确保id存在）
                const formattedResults = allResults.map(item => ({
                    ...item,
                    id: item.id || item.agentId || item.flowId // 兼容不同字段名
                }));

                setSearchResults(formattedResults);
            } catch (error) {
                console.error("搜索失败:", error);
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    const handleSearch = useDebounce(handleSearchChange, 360, false)

    const handleSearchClear = () => {
        setSearchQuery("")
        setIsSearching(false)
        setSearchResults([])
    }

    const addToFavorites = async (type: string, id: string) => {
        let mappedType: string;
        if (type === '1') {
            mappedType = 'flow';
        } else if (type === '5') {
            mappedType = 'assistant';
        } else {
            mappedType = 'workflow';
        }

        const res = await addToFrequentlyUsed(mappedType, id);
        console.log(res);
        // 成功时更新收藏列表
        setFavorites(res.data);
        return res;

    }


    const removeFromFavorites = async (userId: string, type: string, id: string) => {
        let mappedType: string;
        if (type === '1') {
            mappedType = 'flow';
        } else if (type === '5') {
            mappedType = 'assistant';
        } else {
            mappedType = 'workflow';
        }
        const res = await removeFromFrequentlyUsed(userId, mappedType, id);
    }

    const clearAllConversations = store.useClearConvoState();
    const { setConversation } = store.useCreateConversationAtom(0);
    const queryClient = useQueryClient();

    const navigate = useNavigate();
    const handleCardClick = (agent) => {
        console.log('agent :>> ', agent);

        const _chatId = generateUUID(32)
        const flowId = agent.id
        const flowType = agent.flow_type || agent.type
        // 新建会话
        queryClient.setQueryData<ConversationData>([QueryKeys.allConversations], (convoData) => {
            if (!convoData) {
                return convoData;
            }
            setConversation((prevState: any) => {
                return {
                    ...prevState,
                    conversationId: _chatId
                }
            })
            return addConversation(convoData, {
                conversationId: _chatId,
                createdAt: "",
                endpoint: null,
                endpointType: null,
                model: "",
                flowId,
                flowType: flowType,
                title: agent.name,
                tools: [],
                updatedAt: ""
            });
        });
        navigate(`/chat/${_chatId}/${flowId}/${flowType}`);
    }

    const { data: bsConfig } = useGetBsConfig()

    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Header */}
            <div className="sticky top-0 z-40 border-b relative overflow-hidden">
                {/* 背景图片 */}
                <div className="absolute top-0 left-0 right-0 w-full overflow-hidden" style={{ height: '100%', zIndex: 0 }}>
                    <div className="relative w-full h-full">
                        <img 
                            className="w-full h-full object-cover animate-fade-in" 
                            style={{ animation: 'fadeIn 1s ease-in-out' }}
                            src={__APP_ENV__.BASE_URL + '/assets/hc.png'} 
                            alt="恒创" 
                        />
                        {/* 渐变遮罩，让文字更易读 */}
                        <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-white/95 dark:from-gray-900/95 via-white/80 dark:via-gray-900/80 to-transparent"></div>
                    </div>
                </div>
                {/* 添加CSS动画样式 */}
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .animate-fade-in {
                        animation: fadeIn 1s ease-in-out;
                    }
                `}</style>
                <div className="container mx-auto px-6 py-6 relative z-10">
                    <div className="mt-2">
                        <h1 className="text-blue-600 text-[32px] truncate max-w-[600px] font-medium mb-2">{bsConfig?.applicationCenterWelcomeMessage || localize('com_app_center_welcome')}</h1>
                        <p className="text-muted-foreground text-base truncate max-w-[600px]">{bsConfig?.applicationCenterDescription || localize('com_app_center_description')}</p>
                    </div>
                    <div className="mt-8 flex items-start justify-between">
                        <AgentNavigation onCategoryChange={handleCategoryChange} onRefresh={refreshAgentData} />
                        <div className="relative w-80 min-w-48">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder={localize('com_agent_search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    handleSearch(e.target.value)
                                }}
                                className="pl-10 pr-10 h-10 rounded-full"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleSearchClear}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="relative" style={{ height: "calc(100vh - 200px)" }}>
                <div ref={scrollContainerRef} className="container mx-auto px-6 py-6 pb-96 h-full overflow-y-auto scrollbar-hide">
                    {/* 热门上新区域 */}
                    {!isSearching && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">🔥</span>
                                </div>
                                <span className="text-orange-500 font-semibold text-sm">热门上新</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                                汇报/培训/答辩，海量PPT模版免费用
                            </h2>
                            <div className="flex gap-2 mb-6">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">PPT模版</span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">汇报</span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">培训</span>
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-gray-400">答辩</span>
                            </div>

                            {/* 主要功能卡片和工具卡片 */}
                            <div className="flex gap-6 mb-8">
                                {/* 左侧：三个主要功能卡片 */}
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                    {/* PPT创作 */}
                                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">
                                                N
                                            </div>
                                            <div className="px-2 py-1 bg-purple-500 rounded text-xs text-white">海量模版</div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">PPT创作</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">一句话长文本生成精美PPT</p>
                                        <button className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            开始创作
                                        </button>
                                    </div>

                                    {/* 实时记录 */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-100 dark:border-green-800/30 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">实时记录</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">音转文，区分发言人总结要点</p>
                                        <button className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                            </svg>
                                            开始录音
                                        </button>
                                    </div>

                                    {/* 音视频速读 */}
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800/30 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-3">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">音视频速读</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">音转文，网课神器</p>
                                        <button className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            开始上传
                                        </button>
                                    </div>
                                </div>

                                {/* 右侧：工具卡片 */}
                                <div className="w-64 space-y-3">
                                    {/* 阅读助手 */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white">阅读助手</h4>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">文档问答总结翻译</p>
                                    </div>

                                    {/* 链接速读 */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                                                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white">链接速读</h4>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">解析网页和播客链接</p>
                                    </div>

                                    {/* AI笔记 */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </div>
                                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white">AI笔记</h4>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">个人知识管理利器</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <AgentGrid
                        favorites={favorites}
                        onAddToFavorites={addToFavorites}
                        onRemoveFromFavorites={removeFromFavorites}
                        sectionRefs={sectionRefs}
                        refreshTrigger={refreshTrigger}
                        onCardClick={handleCardClick}
                    />
                    {isSearching && (
                        <SearchOverlay
                            query={searchQuery}
                            results={searchResults}
                            loading={searchLoading}
                            favorites={favorites}
                            onAddToFavorites={addToFavorites}
                            onRemoveFromFavorites={removeFromFavorites}
                            onClose={handleSearchClear}
                            onCardClick={handleCardClick}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

/* 添加常用应用 */
export const addCommonlyAppState = atom<Record<string, { id: string, type: number }>>({
    key: "addCommonlyAppState",
    default: null,
})