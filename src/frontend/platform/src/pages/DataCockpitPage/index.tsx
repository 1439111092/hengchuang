import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import KnowledgeBaseFileCard from '@/components/dataCockpitPage';
import { formatDate } from "@/util/utils";
import { getAuditAppListApi } from "@/controllers/API/log";
import { readFileLibDatabase, readFileByLibDatabase } from "@/controllers/API";
import type { ECharts as EChartsInstance } from 'echarts';

declare const __APP_ENV__: {
  BASE_URL: string;
};

type DateRange = [Date | null, Date | null];

interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  dateRange?: DateRange;
  appName?: Array<{ value: string }>;
  userName?: Array<{ value: string }>;
  userGroup?: string[];
  feedback?: string;
  sensitive_status?: number;
}

interface EmployeeFeedbackDatum {
  flow_name: string;
  user_name: string;
  user_id: number;
  like_count: number;
  dislike_count: number;
  copied_count: number;
  sensitive_status: number;
  usage_count: number; // 使用次数（合并的记录数）
}
// 模拟数据
const mockData = {
  totalSales: 2_845_390,
  orderCount: 12_584,
  activeUsers: 68_231,
  conversionRate: 18.7,
  barData: [120, 200, 150, 280, 300, 230],
  pieData: [
    { value: 1048, name: '搜索引擎' },
    { value: 735, name: '直接访问' },
    { value: 580, name: '邮件营销' },
    { value: 484, name: '联盟广告' },
    { value: 300, name: '视频广告' }
  ],
  lineData: [120, 132, 101, 134, 290, 230, 220]
};

interface KnowledgeBaseStat {
  fileCount: number;
  title: string;
  knowledgeId?: number;
}

// 在 mockData 下面添加
const mockEmployeeData: EmployeeFeedbackDatum[] = [
  {
    flow_name: "智能体多轮对话",
    user_name: "panshixian@hc-znzb.com",
    user_id: 1,
    like_count: 5,
    dislike_count: 2,
    copied_count: 3,
    sensitive_status: 1,
    usage_count: 1,
  },
  {
    flow_name: "客服问答流程",
    user_name: "zhangsan@hc-znzb.com",
    user_id: 2,
    like_count: 10,
    dislike_count: 1,
    copied_count: 7,
    sensitive_status: 0,
    usage_count: 1,
  },
  {
    flow_name: "知识库检索助手",
    user_name: "lisi@hc-znzb.com",
    user_id: 3,
    like_count: 15,
    dislike_count: 0,
    copied_count: 12,
    sensitive_status: 1,
    usage_count: 1,
  },
  {
    flow_name: "会议纪要生成器",
    user_name: "wangwu@hc-znzb.com",
    user_id: 4,
    like_count: 8,
    dislike_count: 3,
    copied_count: 5,
    sensitive_status: 0,
    usage_count: 1,
  },
];

const getStrTime = (date?: DateRange): [string | undefined, string | undefined] => {
  const start = date?.[0] ?? null;
  const end = date?.[1] ?? null;
  const startDate = start ? `${formatDate(start, 'yyyy-MM-dd')} 00:00:00` : undefined;
  const endDate = end ? `${formatDate(end, 'yyyy-MM-dd')} 23:59:59` : undefined;
  return [startDate, endDate];
};


const DataCockpitPage: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const pageRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const employeeAgentRef = useRef<HTMLDivElement>(null);
  const [datalist, setDatalist] = useState<Record<string, unknown>[]>([]);
  const [employeeData, setEmployeeData] = useState<EmployeeFeedbackDatum[]>(mockEmployeeData);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [knowledgeBaseStats, setKnowledgeBaseStats] = useState<KnowledgeBaseStat[]>([]);
  const [loadingKnowledgeStats, setLoadingKnowledgeStats] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeString = useMemo(() => {
    return time.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [time]);

  const dateString = useMemo(() => {
    const weekLabel = time.toLocaleDateString('zh-CN', { weekday: 'short' });
    return `${formatDate(time, 'yyyy年MM月dd日')} · ${weekLabel}`;
  }, [time]);

  const periodLabel = useMemo(() => {
    const hour = time.getHours();
    if (hour < 6) return '凌晨';
    if (hour < 9) return '清晨';
    if (hour < 12) return '上午';
    if (hour < 14) return '中午';
    if (hour < 18) return '下午';
    if (hour < 22) return '晚上';
    return '深夜';
  }, [time]);

  // 仅将“驾驶舱界面”容器置为全屏
  const toggleFullscreen = useCallback(async () => {
    try {
      const el = pageRef.current;
      if (!el) return;
      const doc: any = document;
      const isFs =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement;
      if (!isFs) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        } else if ((el as any).msRequestFullscreen) {
          await (el as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (e) {
      console.error('Fullscreen toggle failed:', e);
    }
  }, []);

  // 同步全屏状态
  useEffect(() => {
    const handler = () => {
      const doc: any = document;
      const active =
        !!doc.fullscreenElement ||
        !!doc.webkitFullscreenElement ||
        !!doc.msFullscreenElement;
      setIsFullscreen(active);
      // 触发图表自适应
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler as any);
    document.addEventListener('msfullscreenchange', handler as any);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler as any);
      document.removeEventListener('msfullscreenchange', handler as any);
    };
  }, []);
  
  const fetchData = useCallback(async (param: AuditQueryParams = {}) => {
    try {
      const [start_date, end_date] = getStrTime(param.dateRange);
      const res = await getAuditAppListApi({
        page: param.page ?? 1,
        page_size: param.pageSize ?? 10,
        flow_ids: param.appName?.length ? param.appName.map((el) => el.value) : undefined,
        user_ids: param.userName?.[0]?.value || undefined,
        group_ids: param.userGroup || undefined,
        start_date,
        end_date,
        feedback: param.feedback || undefined,
        sensitive_status: param.sensitive_status || undefined,
      });
      console.log("res",res.data)
      

      setDatalist(res.data || []); // 假设后端返回结构为 { data: { list, total } }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setDatalist([]);
    } finally {
    }
  }, []);
  
  // 从 datalist 中提取所需字段并按 user_name 和 flow_name 合并数据
  useEffect(() => {
    if (datalist && datalist.length > 0) {
      // 使用 Map 来按 user_name + flow_name 分组
      const dataMap = new Map<string, EmployeeFeedbackDatum>();
      
      datalist.forEach((item) => {
        const flowName = (item.flow_name as string) || '';
        const userName = (item.user_name as string) || '';
        const userId = (item.user_id as number) || 0;
        const likeCount = (item.like_count as number) || 0;
        const dislikeCount = (item.dislike_count as number) || 0;
        const copiedCount = (item.copied_count as number) || 0;
        const sensitiveStatus = (item.sensitive_status as number) ?? 0;
        
        // 使用 user_name + flow_name 作为唯一键
        const key = `${userName}|||${flowName}`;
        
        if (dataMap.has(key)) {
          // 如果已存在，则合并数据
          const existing = dataMap.get(key)!;
          existing.like_count += likeCount;
          existing.dislike_count += dislikeCount;
          existing.copied_count += copiedCount;
          // sensitive_status: 如果任何一条记录是敏感的，就标记为敏感（取最大值）
          existing.sensitive_status = Math.max(existing.sensitive_status, sensitiveStatus);
          // 使用次数加1
          existing.usage_count += 1;
        } else {
          // 如果不存在，创建新记录，使用次数初始为1
          dataMap.set(key, {
            flow_name: flowName,
            user_name: userName,
            user_id: userId,
            like_count: likeCount,
            dislike_count: dislikeCount,
            copied_count: copiedCount,
            sensitive_status: sensitiveStatus,
            usage_count: 1,
          });
        }
      });
      
      // 将 Map 转换为数组，并按总互动次数（点赞+点踩+复制）降序排序
      const extractedData: EmployeeFeedbackDatum[] = Array.from(dataMap.values())
        .sort((a, b) => {
          const totalA = a.like_count + a.dislike_count + a.copied_count;
          const totalB = b.like_count + b.dislike_count + b.copied_count;
          return totalB - totalA; // 降序排序
        });
      setEmployeeData(extractedData);
    } else {
      // 如果没有数据，使用 mock 数据
      setEmployeeData(mockEmployeeData);
    }
  }, [datalist]);

  // 实时时间更新
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 获取所有知识库文件统计
  const fetchKnowledgeBaseStats = useCallback(async () => {
    try {
      setLoadingKnowledgeStats(true);
      // 获取所有知识库列表（分页获取所有）
      let allKnowledgeBases: any[] = [];
      let page = 1;
      const pageSize = 50;
      let hasMore = true;

      while (hasMore) {
        const knowledgeListRes = await readFileLibDatabase({ 
          page, 
          pageSize, 
          name: '',
          type: 0 
        });
        
        const knowledgeList = knowledgeListRes.data || [];
        allKnowledgeBases = [...allKnowledgeBases, ...knowledgeList];
        
        // 如果返回的数据少于pageSize，说明没有更多了
        if (knowledgeList.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      if (allKnowledgeBases.length === 0) {
        setKnowledgeBaseStats([]);
        return;
      }
      
      // 获取每个知识库的文件数
      const statsPromises = allKnowledgeBases.map(async (kb: any) => {
        try {
          const fileRes = await readFileByLibDatabase({ 
            id: kb.id, 
            page: 1, 
            pageSize: 1,  // 只需要获取total，不需要实际数据
            name: '',
            status: undefined,
            file_ids: undefined
          });
          return {
            fileCount: fileRes.total || 0,
            title: `${kb.name}知识库文件数`,
            knowledgeId: kb.id
          };
        } catch (error) {
          console.error(`Failed to get file count for knowledge base ${kb.id}:`, error);
          return {
            fileCount: 0,
            title: `${kb.name}知识库文件数`,
            knowledgeId: kb.id
          };
        }
      });
      
      const allStats = await Promise.all(statsPromises);
      
      // 按文件数降序排序
      const sortedStats = allStats.sort((a, b) => b.fileCount - a.fileCount);
      
      setKnowledgeBaseStats(sortedStats);
    } catch (error) {
      console.error('Failed to fetch knowledge base stats:', error);
      setKnowledgeBaseStats([]);
    } finally {
      setLoadingKnowledgeStats(false);
    }
  }, []);

  // 走马灯自动滚动
  useEffect(() => {
    if (knowledgeBaseStats.length <= 4) return; // 如果少于等于4个，不需要滚动
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = Math.ceil(knowledgeBaseStats.length / 4) - 1;
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 5000); // 每5秒切换一次

    return () => clearInterval(interval);
  }, [knowledgeBaseStats.length]);

  // 初始化 ECharts 图表
  useEffect(() => {
    fetchData();
    fetchKnowledgeBaseStats();
  }, [fetchData, fetchKnowledgeBaseStats]);

  useEffect(() => {
    if (!employeeAgentRef.current || !lineRef.current) return;
    
    const charts: EChartsInstance[] = [];
    const resizeCleanups: Array<() => void> = [];

    const initChart = (ref: React.RefObject<HTMLDivElement>, option: echarts.EChartsCoreOption) => {
      if (ref.current) {
        const chart = echarts.init(ref.current, {
          renderer: 'canvas',
          backgroundColor: 'transparent'
        });
        chart.setOption(option);
        const resizeHandler = () => chart.resize();
        window.addEventListener('resize', resizeHandler);
        charts.push(chart);
        resizeCleanups.push(() => window.removeEventListener('resize', resizeHandler));
        return chart;
      }
    };


    // 折线图 - 流动光点 + 光影轨迹
    initChart(lineRef, {
      title: { text: '用户活跃趋势', textStyle: { color: '#e0f2fe' } },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLabel: { color: '#bae6fd' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#bae6fd' },
        splitLine: { lineStyle: { color: '#083344' } }
      },
      series: [
        {
          data: mockData.lineData,
          type: 'line',
          smooth: true,
          lineStyle: { width: 3, color: '#8b5cf6' },
          areaStyle: { color: 'rgba(139, 92, 246, 0.2)' },
          symbol: 'circle',
          symbolSize: 6,
          markPoint: {
            data: [{ type: 'max', name: '峰值' }],
            effect: { show: true, type: 'ripple', period: 3, scale: 2 }
          },
          animationDelayUpdate: (idx: number) => idx * 100,
          animationEasing: 'quinticInOut'
        }
      ]
    });

    // 员工智能体使用情况 —— 聚焦 flow_name 和互动行为
    initChart(employeeAgentRef, {
      backgroundColor: 'transparent',
      title: {
        text: '员工智能体使用与反馈',
        left: 'center',
        textStyle: {
          color: '#e0f2fe',
          fontSize: 18,
          fontWeight: 'bold'
        },
        top: 10
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(8, 47, 70, 0.95)',
        borderColor: '#0ea5e9',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textStyle: {
          color: '#f0f9ff',
          fontSize: 13,
          lineHeight: 20
        },
        formatter: (params: any) => {
          const item = params[0];
          const dataItem = employeeData[item.dataIndex];
          if (!dataItem) return '';
          return `
        <div style="font-weight: bold; color: #ffaa00;">${dataItem.user_name}</div>
        <div style="margin-top: 4px; font-size: 13px;">
          智能体：${dataItem.flow_name}<br/>
          📊 近期使用次数：<span style="color:#8b5cf6">${dataItem.usage_count}</span><br/>
          👍 点赞：<span style="color:#5470C6">${dataItem.like_count}</span><br/>
          👎 点踩：<span style="color:#EF4444">${dataItem.dislike_count}</span><br/>
          📋 复制：<span style="color:#22C55E">${dataItem.copied_count}</span>
        </div>
      `;
        }
      },
      legend: {
        bottom: 15,
        itemWidth: 16,
        itemHeight: 16,
        textStyle: {
          color: '#bae6fd',
          fontSize: 13
        },
        data: ['近期使用次数']
      },
      grid: {
        left: '5%',
        right: '10%',
        top: 60,
        bottom: 60,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '近期使用次数',
        nameGap: -35,
        nameTextStyle: {
          color: '#93c5fd',
          fontSize: 12
        },
        axisLabel: {
          color: '#bae6fd',
          fontSize: 12
        },
        axisLine: {
          lineStyle: { color: '#38bdf8', width: 1 }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#083344',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: employeeData.map(item => {
          const userName = item.user_name.includes('@') 
            ? item.user_name.split('@')[0] 
            : item.user_name;
          return `${userName} · ${item.flow_name}`;
        }),
        axisLabel: {
          color: '#bae6fd',
          fontSize: 12,
          width: 180,
          overflow: 'break',
          lineHeight: 20,
          rich: {
            user: { fontWeight: 'bold', color: '#ffaa00' }
          }
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#38bdf8' } }
      },
      series: [
        {
          name: '近期使用次数',
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#a78bfa' },
              { offset: 1, color: '#8b5cf6' }
            ])
          },
          emphasis: { focus: 'series' },
          data: employeeData.map(item => item.usage_count)
        }
      ]
    });


    return () => {
      resizeCleanups.forEach(cleanup => cleanup());
      charts.forEach(chart => {
        if (!chart.isDisposed()) {
          chart.dispose();
        }
      });
    };
  }, [employeeData]);



  return (
    <>
      {/* 自定义动画样式 */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <div
        ref={pageRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat text-white relative overflow-hidden -m-4"
        style={{
          backgroundImage: `url(${__APP_ENV__.BASE_URL}/bgdata.png)`,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 0,
          backgroundColor: 'transparent',
        }}
      >

      {/* 顶部标题栏 */}
      <header className="relative z-10 px-4 sm:px-6 pt-3 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 w-full">
          <div className="flex w-full justify-center sm:justify-end">
            <div className="flex w-full sm:w-auto max-w-full sm:max-w-md items-center gap-4 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/15 via-slate-900/60 to-indigo-500/15 px-5 py-2 shadow-[0_12px_40px_rgba(14,165,233,0.25)] backdrop-blur-md">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20">
                <span
                  className="absolute h-full w-full rounded-full bg-sky-400/40 opacity-70 animate-ping"
                  aria-hidden="true"
                />
                <span className="relative text-[0.6rem] tracking-[0.4em] text-sky-100/90">
                  NOW
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 leading-tight text-right text-sky-50">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="text-sm text-sky-100/80">{periodLabel}</span>
                  <time
                    dateTime={time.toISOString()}
                    className="text-2xl sm:text-3xl font-mono font-semibold tracking-[0.3em] text-sky-50 drop-shadow-[0_2px_6px_rgba(14,165,233,0.35)]"
                  >
                    {timeString}
                  </time>
                </div>
                <span className="text-xs sm:text-sm text-slate-200/80">{dateString}</span>
              </div>
            </div>
          </div>

          {/* 全屏按钮，仅影响驾驶舱容器 */}
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center rounded-full border border-sky-500/40 bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-50 transition-colors duration-200 hover:bg-sky-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
              title={isFullscreen ? '返回' : '全屏'}
            >
              {isFullscreen ? '返回' : '全屏'}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-8xl mb-2 mx-4 h-[calc(100vh-120px)] grid-rows-[1fr_3fr]">

        {/* 知识库文件统计 - 走马灯效果 */}
        <div className="lg:col-span-4 relative mt-8">
          {loadingKnowledgeStats ? (
            // 加载状态 - 美化样式
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-sky-900/30 via-slate-900/40 to-indigo-900/30 p-6 rounded-xl border border-sky-500/30 backdrop-blur-md animate-pulse relative overflow-hidden"
                >
                  {/* 加载动画光效 */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.1), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                  
                  <div className="flex flex-col items-center justify-center h-full relative z-10">
                    <div className="w-8 h-8 bg-sky-500/20 rounded-full mb-4 animate-pulse" />
                    <div className="h-16 w-24 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 rounded-lg mb-4 animate-pulse" style={{ animationDelay: `${index * 0.1}s` }} />
                    <div className="h-4 w-40 bg-sky-500/20 rounded-full animate-pulse" style={{ animationDelay: `${index * 0.2}s` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : knowledgeBaseStats.length > 0 ? (
            <div className="relative overflow-hidden">
              {/* 走马灯容器 - 使用flex布局，添加渐变遮罩 */}
              <div className="relative">
                {/* 左侧渐变遮罩 */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[rgba(8,47,70,0.95)] to-transparent z-10 pointer-events-none" />
                {/* 右侧渐变遮罩 */}
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[rgba(8,47,70,0.95)] to-transparent z-10 pointer-events-none" />
                
                <div 
                  className="flex gap-6 transition-transform duration-1000 ease-in-out"
                  style={{
                    transform: `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 1.5}rem))`,
                  }}
                >
                {/* 将知识库数据分组，每组4个 */}
                {Array.from({ length: Math.ceil(knowledgeBaseStats.length / 4) }).map((_, groupIndex) => (
                  <div 
                    key={groupIndex}
                    className="flex-shrink-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {knowledgeBaseStats
                      .slice(groupIndex * 4, groupIndex * 4 + 4)
                      .map((item, itemIndex) => (
                        <KnowledgeBaseFileCard
                          key={item.knowledgeId || groupIndex * 4 + itemIndex}
                          fileCount={item.fileCount}
                          title={item.title}
                        />
                      ))}
                  </div>
                ))}
                </div>
              </div>
              
              {/* 指示器 - 美化样式 */}
              {knowledgeBaseStats.length > 4 && (
                <div className="flex justify-center items-center gap-3 mt-6">
                  {Array.from({ length: Math.ceil(knowledgeBaseStats.length / 4) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative rounded-full transition-all duration-500 ${
                        currentIndex === index 
                          ? 'w-10 h-2.5 bg-gradient-to-r from-sky-400 to-indigo-400 shadow-[0_0_12px_rgba(14,165,233,0.6)]' 
                          : 'w-2.5 h-2.5 bg-sky-400/40 hover:bg-sky-400/60 hover:scale-125'
                      }`}
                      aria-label={`切换到第${index + 1}页`}
                    >
                      {currentIndex === index && (
                        <span className="absolute inset-0 rounded-full bg-sky-400/50 animate-ping" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sky-100/70 py-8">
              暂无知识库数据
            </div>
          )}
        </div>



        {/* 图表区域：占满 4 列，内部 3x2 布局，自动填充剩余空间 */}
        <div className="lg:col-span-4 h-full pb-12 min-h-0">
          <div className="grid grid-cols-3 gap-6 h-full pb-5 min-h-0">
            {/* 上排三个 */}
            <div className="flex flex-col gap-6 h-full min-h-0">
              <div
                ref={employeeAgentRef}
                className="bg-black/20 p-4 rounded-lg border border-blue-500/30 flex-1 flex flex-col"
                style={{
                  backgroundImage: `url(${__APP_ENV__.BASE_URL}/cockpit/2.png)`,
                  backgroundSize: '100% 100%',        // 关键：宽度和高度都拉满，和 div 一致
                  backgroundRepeat: 'no-repeat',      // 不重复
                  backgroundPosition: 'center',       // 居中（视觉上更稳）
                }}

              >

              </div>
            </div>



            {/* 中间列：上大下小，且高度正常 */}
            <div className="flex flex-col h-full gap-6 min-h-0">
              <div className="p-4 rounded-lg border border-purple-500/30 flex-[1] flex flex-col relative overflow-hidden">
                {/* 背景视频 */}
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  src={`${__APP_ENV__.BASE_URL}/cockpit/robot.mp4`}
                />

                {/* 如果你未来要在视频上叠加文字等内容，放在这里 */}
                <div className="relative z-10 flex-1">
                  {/* 你的内容（目前为空） */}
                </div>
              </div>
            </div>




            <div className="flex flex-col gap-6 h-full min-h-0">
              <div
                ref={lineRef}
                className="bg-black/20 p-4 rounded-lg border border-indigo-500/30 flex-1 flex flex-col"
                style={{
                  backgroundImage: `url(${__APP_ENV__.BASE_URL}/cockpit/2.png)`,
                  backgroundSize: '100% 100%',        // 关键：宽度和高度都拉满，和 div 一致
                  backgroundRepeat: 'no-repeat',      // 不重复
                  backgroundPosition: 'center',       // 居中（视觉上更稳）
                }}
              >
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default DataCockpitPage;