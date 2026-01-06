import {
    ApplicationIcon,
    BookOpenIcon,
    EvaluatingIcon,
    // GithubIcon,
    KnowledgeIcon,
    LabelIcon,
    LogIcon,
    ModelIcon,
    QuitIcon,
    SystemIcon,
    TechnologyIcon
} from "@/components/bs-icons";
import { LoadingIcon } from "@/components/bs-icons/loading";
import { DatasetIcon } from "@/components/bs-icons/menu/dataset";
import { bsConfirm } from "@/components/bs-ui/alertDialog/useConfirm";
import { SelectHover, SelectHoverItem } from "@/components/bs-ui/select/hover";
import { locationContext } from "@/contexts/locationContext";
import i18next from "i18next";
import { Check, ChevronDown, ChevronRight, Lock, MoonStar, Sun, BarChart3 } from "lucide-react";
import { Suspense, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu } from 'antd';
import { Separator } from "../components/bs-ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/bs-ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "../components/bs-ui/popover";
import { darkContext } from "../contexts/darkContext";
import { userContext } from "../contexts/userContext";
import { logoutApi } from "../controllers/API/user";
import { captureAndAlertRequestErrorHoc } from "../controllers/request";
import { User } from "../types/api/user";
import HeaderMenu from "./HeaderMenu";
import "./MainLayout.css";

export default function MainLayout() {
    const { dark, setDark } = useContext(darkContext);
    const { appConfig } = useContext(locationContext)
    // 角色
    const { user, setUser } = useContext(userContext);
    const { language, languageNames, options, changLanguage, t } = useLanguage(user)
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        bsConfirm({
            title: `${t('prompt')}!`,
            desc: `${t('menu.logoutContent')}？`,
            okTxt: t('system.confirm'),
            onOk(next) {
                captureAndAlertRequestErrorHoc(logoutApi()).then(_ => {
                    setUser(null)
                    localStorage.removeItem('isLogin')
                })
                next()
            }
        })
    }

    // 重置密码
    const navigator = useNavigate()
    const JumpResetPage = () => {
        localStorage.setItem('account', user.user_name)
        navigator('/reset')
    }

    // 系统管理员(超管、组超管)
    const isAdmin = useMemo(() => {
        return ['admin', 'group_admin'].includes(user.role)
    }, [user])

    const isMenu = (menu) => {
        return user.web_menu.includes(menu) || user.role === 'admin'
    }

    // 侧边栏宽度拖拽
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [isDragging, setIsDragging] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newWidth = e.clientX;
            if (newWidth >= 180 && newWidth <= 400) {
                setSidebarWidth(newWidth);
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
    }, [isDragging]);

    // 获取当前选中的菜单项
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path.startsWith('/build')) return 'build';
        if (path.startsWith('/filelib')) return 'knowledge';
        if (path.startsWith('/dataset')) return 'dataset';
        if (path.startsWith('/model')) return 'model';
        if (path.startsWith('/evaluation')) return 'evaluation';
        if (path.startsWith('/label')) return 'label';
        if (path.startsWith('/log')) return 'log';
        if (path.startsWith('/sys')) return 'sys';
        if (path.startsWith('/dashboard')) return 'dashboard';
        return '';
    }

    // 构建菜单项
    const menuItems = useMemo(() => {
        const items = [];
        
        if (appConfig.benchMenu) {
            items.push({
                key: 'workspace',
                label: (
                    <a href="/workspace/" target="_blank" rel="noopener noreferrer" className="menu-item-link">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                                <ApplicationIcon className="h-5 w-5 mr-3" />
                                <span>{t('menu.workspace')}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-50 transition-opacity" />
                        </div>
                    </a>
                ),
            });
        }

        if (isMenu('build')) {
            items.push({
                key: 'build',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/build')}>
                        <div className="flex items-center">
                            <TechnologyIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.skills')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        if (isMenu('knowledge')) {
            items.push({
                key: 'knowledge',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/filelib')}>
                        <div className="flex items-center">
                            <KnowledgeIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.knowledge')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        if (user.role === 'admin') {
            items.push({
                key: 'dataset',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/dataset')}>
                        <div className="flex items-center">
                            <DatasetIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.dataset')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        if (isMenu('model')) {
            items.push({
                key: 'model',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/model')}>
                        <div className="flex items-center">
                            <ModelIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.models')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        if (isMenu('evaluation')) {
            items.push({
                key: 'evaluation',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/evaluation')}>
                        <div className="flex items-center">
                            <EvaluatingIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.evaluation')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        if (isMenu('dashboard')) {
            items.push({
                key: 'dashboard',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/dashboard')}>
                        <div className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-3" />
                            <span>{t('menu.dashboard')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        items.push({
            key: 'label',
            label: (
                <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/label')}>
                    <div className="flex items-center">
                        <LabelIcon className="h-5 w-5 mr-3" />
                        <span>{t('menu.annotation')}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            ),
        });

        if (isAdmin) {
            items.push({
                key: 'log',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/log')}>
                        <div className="flex items-center">
                            <LogIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.log')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        if (isAdmin) {
            items.push({
                key: 'sys',
                label: (
                    <div className="flex items-center justify-between w-full menu-item-link" onClick={() => navigate('/sys')}>
                        <div className="flex items-center">
                            <SystemIcon className="h-5 w-5 mr-3" />
                            <span>{t('menu.system')}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ),
            });
        }

        return items;
    }, [user, appConfig, isAdmin, isMenu, t, navigate]);

    return <div className="flex h-screen">
        {/* 侧边栏 - 从顶部开始占满整个高度 */}
        <div 
            ref={sidebarRef}
            className="relative z-10 sidebar-container flex flex-col border-r border-gray-200 dark:border-gray-700 rounded-lg"
            style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px`, height: "100vh" }}
        >
            {/* Logo和标题区域 */}
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700" style={{ backgroundColor: '#2d2d2d' }}>
                <div className="flex items-center justify-center">
                    <Link to="/build" className="cursor-pointer">
                        {/* @ts-ignore */}
                        <img 
                            src={__APP_ENV__.BASE_URL + '/logo.png'} 
                            className="w-[170px] h-auto" 
                            alt="Logo" 
                        />
                    </Link>
                </div>
            </div>
            
            {/* 导航菜单区域 */}
            <div className="flex-1 overflow-y-auto">
                <Menu
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                    className="border-none bg-transparent sidebar-menu"
                    style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                    }}
                />
            </div>
            
            {/* 拖拽条 */}
            <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-20"
                onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                style={{
                    backgroundColor: isDragging ? '#1890ff' : 'transparent'
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
            />
            
            {/* 用户管理区域 */}
            <div className="border-t border-gray-600 dark:border-gray-600 px-3 py-3" style={{ backgroundColor: '#2d2d2d' }}>
                <Popover>
                    <PopoverTrigger asChild>
                        <div className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity group py-1">
                            {/* @ts-ignore */}
                            <img 
                                className="h-10 w-10 rounded-full mb-1.5 border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-500 transition-colors shadow-sm" 
                                src={__APP_ENV__.BASE_URL + '/assets/user.png'} 
                                alt="用户头像" 
                            />
                            <span className="text-base font-medium text-white max-w-full truncate px-2">
                                {user.user_name}
                            </span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent 
                        className="w-48 p-2" 
                        align="center" 
                        side="top"
                        sideOffset={8}
                    >
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={JumpResetPage}
                                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                <span>{t('menu.changePwd')}</span>
                            </button>
                            <Separator className="my-1" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-red-600 dark:text-red-400"
                            >
                                <QuitIcon className="w-4 h-4 mr-2" />
                                <span>{t('menu.logout')}</span>
                            </button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        
        {/* 右侧内容区域 */}
        <div className="flex-1 flex flex-col bg-background-main" style={{ width: `calc(100vw - ${sidebarWidth}px)` }}>
            {/* 顶部Header */}
            <div className="flex justify-between h-[64px] bg-background-main relative z-[21]">
                <div className="flex h-9 my-[14px]">
                </div>
                <div>
                    <HeaderMenu />
                </div>
                <div className="flex w-fit relative z-10">
                    <div className="flex">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="h-8 w-8 bg-header-icon rounded-lg cursor-pointer my-4" onClick={() => setDark(!dark)}>
                                    <div className="">
                                        {dark ? (
                                            <Sun className="side-bar-button-size dark:text-slate-50 mx-auto w-[13px] h-[13px]" />
                                        ) : (
                                            <MoonStar className="side-bar-button-size mx-auto w-[17px] h-[17px]" />
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('menu.themeSwitch')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Separator className="mx-[4px] dark:bg-[#111111]" orientation="vertical" />
                        <SelectHover
                            triagger={
                                <div className="h-8 px-3 bg-header-icon rounded-lg cursor-pointer my-4 flex items-center justify-center">
                                    <span className="text-sm leading-8">{languageNames[language]}</span>
                                    <ChevronDown className="ml-1 w-4 h-4" />
                                </div>
                            }>
                            {Object.entries(options).map(([key, value]) => (
                                <SelectHoverItem key={key} onClick={() => changLanguage(key)}>
                                    <span>{value}</span>
                                    {language === key && <Check className="w-4 h-4 absolute top-1/2 right-0 transform -translate-y-1/2" />}
                                </SelectHoverItem>
                            ))}
                        </SelectHover>
                        <Separator className="mx-[4px] dark:bg-[#111111]" orientation="vertical" />
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className="bg-header-icon rounded-lg cursor-pointer my-4 flex items-center justify-center hover:bg-[#0055e3] hover:text-[white] transition-all px-3 h-8">
                                    <Link to={"https://m7a7tqsztt.feishu.cn/wiki/ZxW6wZyAJicX4WkG0NqcWsbynde"} target="_blank" className="flex items-center gap-2">
                                        <BookOpenIcon className="w-4 h-4" />
                                        <span className="text-sm">帮助文档</span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent><p>{t('menu.document')}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <Separator className="mx-[23px] h-6 border-l my-5 border-[#dddddd]" orientation="vertical" />
                    </div>
                </div>
            </div>
            
            {/* 主要内容区域 */}
            <div 
                className="flex-1 bg-background-main-content rounded-lg overflow-auto"
                style={{ height: "calc(100vh - 64px)" }}
            >
                <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingIcon /></div>}>
                    <Outlet />
                </Suspense>
            </div>
        </div>

        {/* // mobile */}
        <div className="fixed w-full h-full top-0 left-0 bg-[rgba(0,0,0,0.4)] sm:hidden text-sm z-50">
            <div className="w-10/12 bg-gray-50 mx-auto mt-[30%] rounded-xl px-4 py-10">
                <p className=" text-sm text-center">{t('menu.forBestExperience')}</p>
                {
                    !appConfig.isPro && <div className="flex mt-8 justify-center gap-4">
                        <a href={"https://m7a7tqsztt.feishu.cn/wiki/ZxW6wZyAJicX4WkG0NqcWsbynde"} target="_blank">
                            <BookOpenIcon className="side-bar-button-size mx-auto" /> {t('menu.onlineDocumentation')}
                        </a>
                    </div>
                }
            </div>
        </div>
    </div >
};

const useLanguage = (user: User) => {
    const [language, setLanguage] = useState('zh-Hans')
    useEffect(() => {
        const lang = user.user_id ? localStorage.getItem('i18nextLng') : null
        if (lang) {
            setLanguage(lang === 'zh' ? 'zh-Hans' : lang)
        }
    }, [user])

    const { t } = useTranslation()
    const changLanguage = (ln: string) => {
        setLanguage(ln)
        localStorage.setItem('i18nextLng', ln)
        // workspace
        localStorage.removeItem('lang')
        document.cookie = `lang=${ln}; path=/; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}`;
        i18next.changeLanguage(ln)
    }
    return {
        language,
        languageNames: { "zh-Hans": '中文', "en-US": 'English', ja: '日本語' },
        options: { "zh-Hans": '中文', "en-US": 'English', ja: '日本語' },
        changLanguage,
        t
    }
}