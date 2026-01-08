"use client"

import { Heart, Flame, Plus, X } from "lucide-react"
import { useState } from "react"
import { Button } from "~/components"
import AppAvator from "~/components/Avator"
import { Card, CardContent } from "~/components/ui/Card"
import { useLocalize } from "~/hooks"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/Tooltip2"

interface Agent {
    id: string
    name: string
    description: string
    flow_type: number
    logo: string
    category: string
}

interface AgentCardProps {
    agent: Agent
    isFavorite: boolean
    showRemove?: boolean // 决定显示移除还是添加按钮
    onAddToFavorites: () => void
    onRemoveFromFavorites: () => void
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

export function AgentCard({
    agent,
    showRemove = false,
    onClick,
    onAddToFavorites,
    onRemoveFromFavorites,
}: AgentCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const localize = useLocalize()

    // 固定个位数热度数据
    const likes = 3
    const usage = 6

    return (
        <TooltipProvider>
            <Card
                className={`relative cursor-pointer rounded-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                           hover:shadow-lg hover:-translate-y-1 h-[180px] flex flex-col overflow-hidden group`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
            >
                <CardContent className="p-4 flex flex-col flex-1 h-full">
                    <div className="flex flex-col flex-1">
                        {/* 图标和标题区域 */}
                        <div className="flex gap-3 items-start mb-2">
                            <AppAvator
                                id={agent.name}
                                url={agent.logo}
                                flowType={agent.flow_type}
                                className="size-10 min-w-10 rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate mb-1">
                                    {agent.name}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                                        <span>{likes}万+</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                                        <span>{usage}万+</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 描述区域 */}
                        <div className="flex-1 overflow-hidden mb-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-5 line-clamp-2">
                                {agent.description || '专业的AI智能体，为您提供高效便捷的服务'}
                            </p>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    {isHovered && (
                        <div className="absolute top-3 right-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant={showRemove ? "destructive" : "default"}
                                        className={`w-7 h-7 p-0 rounded-full ${showRemove ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            showRemove ? onRemoveFromFavorites() : onAddToFavorites()
                                        }}
                                    >
                                        {showRemove ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">{showRemove ? localize('com_agent_remove_from_favorites') : localize('com_agent_add_to_favorites')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}