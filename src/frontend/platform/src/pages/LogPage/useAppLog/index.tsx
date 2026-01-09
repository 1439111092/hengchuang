
import FilterByApp from "@/components/bs-comp/filterTableDataComponent/FilterByApp";
import FilterByDate from "@/components/bs-comp/filterTableDataComponent/FilterByDate";
import FilterByUser from "@/components/bs-comp/filterTableDataComponent/FilterByUser";
import FilterByUsergroup from "@/components/bs-comp/filterTableDataComponent/FilterByUsergroup";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import AutoPagination from "@/components/bs-ui/pagination/autoPagination";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { locationContext } from "@/contexts/locationContext";
import { userContext } from "@/contexts/userContext";
import { exportCsvDataApi, getAuditAppListApi } from "@/controllers/API/log";
import { useTable } from "@/util/hook";
import { exportCsv, formatDate } from "@/util/utils";
import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Table, Button as AntdButton, Space, Card, Tag, Tooltip, Typography } from "antd";
import { DownloadOutlined, ReloadOutlined, LikeOutlined, DislikeOutlined, CopyOutlined, EyeOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const getStrTime = (date) => {
    const start_date = date[0] && (formatDate(date[0], 'yyyy-MM-dd') + ' 00:00:00')
    const end_date = date[1] && (formatDate(date[1], 'yyyy-MM-dd') + ' 23:59:59')
    return [start_date, end_date]
}

type FilterState = {
    appName: any[];
    userName: any[];
    userGroup: string;
    dateRange: any[];
    feedback: string;
    sensitive_status: string;
};

type Action =
    | { type: 'SET_FILTER'; payload: Partial<FilterState> }
    | { type: 'RESET' };

const filterReducer = (state: FilterState, action: Action): FilterState => {
    switch (action.type) {
        case 'SET_FILTER':
            return { ...state, ...action.payload };
        case 'RESET':
            return {
                appName: [],
                userName: [],
                userGroup: '',
                dateRange: [],
                feedback: '',
                sensitive_status: ''
            };
        default:
            return state;
    }
};

export default function AppUseLog() {
    const { t } = useTranslation()
    const { appConfig } = useContext(locationContext)
    const { message } = useToast()
    // 20 items per page
    const { page, pageSize, data: datalist, total, loading, setPage, filterData } = useTable({}, (param) => {
        const [start_date, end_date] = getStrTime(param.dateRange || [])
        return getAuditAppListApi({
            page: page,
            page_size: param.pageSize,
            flow_ids: param.appName?.length ? param.appName : undefined,
            user_ids: param.userName?.[0]?.value || undefined,
            group_ids: param.userGroup || undefined,
            start_date,
            end_date,
            feedback: param.feedback || undefined,
            sensitive_status: param.sensitive_status || undefined,
        })
    });
    const processedData = useMemo(() =>
        datalist.map((el: any) => ({
            ...el,
            userGroupsString: (el.user_groups || []).map((item: any) => item.name).join(','),
        })),
        [datalist] // Dependency: datalist
    );

    const [filters, dispatch] = useReducer(filterReducer, {
        appName: [],
        userName: [],
        userGroup: '',
        dateRange: [],
        feedback: '',
        sensitive_status: ''
    });

    const resetClick = () => {
        dispatch({ type: 'RESET' });
        filterData({
            appName: [],
            userName: [],
            userGroup: '',
            dateRange: [],
            feedback: '',
            sensitive_status: ''
        })
    }
    // Cache page before entering detail page, temporary solution
    const handleCachePage = () => {
        (window as any).LogPage = page
    }
    useEffect(() => {
        const _page = (window as any).LogPage
        if (_page) {
            setPage(_page);
            delete (window as any).LogPage
        } else {
            setPage(1);
        }
    }, [])

    const { user } = useContext(userContext)
    const [auditing, setAuditing] = useState(false);
    const { Text } = Typography;

    // 定义表格列
    const columns: ColumnsType<any> = [
        {
            title: t('log.appName'),
            dataIndex: 'flow_name',
            key: 'flow_name',
            width: 200,
            ellipsis: {
                showTitle: false,
            },
            render: (text: string) => (
                <Tooltip placement="topLeft" title={text}>
                    <Text className="font-medium" style={{ maxWidth: 200 }} ellipsis>
                        {text}
                    </Text>
                </Tooltip>
            ),
        },
        {
            title: t('log.userName'),
            dataIndex: 'user_name',
            key: 'user_name',
            width: 180,
        },
        {
            title: t('log.userGroup'),
            dataIndex: 'userGroupsString',
            key: 'userGroupsString',
            width: 150,
        },
        {
            title: t('createTime'),
            dataIndex: 'create_time',
            key: 'create_time',
            width: 180,
            render: (text: string) => text?.replace('T', ' ') || '--',
        },
        {
            title: t('log.userFeedback'),
            key: 'feedback',
            width: 200,
            render: (_, record: any) => (
                <Space size="middle">
                    <Tooltip title={t('log.likeFeedback')}>
                        <Space size={4}>
                            <LikeOutlined style={{ color: record.like_count ? '#1890ff' : '#8c8c8c' }} />
                            <span>{record.like_count || 0}</span>
                        </Space>
                    </Tooltip>
                    <Tooltip title={t('log.dislikeFeedback')}>
                        <Space size={4}>
                            <DislikeOutlined style={{ color: record.dislike_count ? '#ff4d4f' : '#8c8c8c' }} />
                            <span>{record.dislike_count || 0}</span>
                        </Space>
                    </Tooltip>
                    <Tooltip title={t('log.copyFeedback')}>
                        <Space size={4}>
                            <CopyOutlined style={{ color: record.copied_count ? '#52c41a' : '#8c8c8c' }} />
                            <span>{record.copied_count || 0}</span>
                        </Space>
                    </Tooltip>
                </Space>
            ),
        },
        ...(appConfig.isPro ? [{
            title: t('log.sensitiveReviewResult'),
            key: 'sensitive_status',
            width: 150,
            render: (_: any, record: any) => (
                record.sensitive_status === 1 ? (
                    <Tag color="success">{t('log.sensitivePass')}</Tag>
                ) : (
                    <Tag color="error">{t('log.sensitiveViolation')}</Tag>
                )
            ),
        }] : []),
        {
            title: t('operations'),
            key: 'action',
            width: 100,
            align: 'right',
            render: (_: any, record: any) => (
                record.chat_id ? (
                    <Link
                        to={`/log/chatlog/${record.flow_id}/${record.chat_id}/${record.flow_type}`}
                        onClick={handleCachePage}
                    >
                        <AntdButton type="link" icon={<EyeOutlined />} size="small">
                            {t('lib.details')}
                        </AntdButton>
                    </Link>
                ) : null
            ),
        },
    ];

    const handleExport = async () => {
        const generateFileName = (start_date, end_date, userName) => {
            let str = '';
            if (start_date && end_date) {
                const startDatePart = start_date.split(' ')[0];
                const endDatePart = end_date.split(' ')[0];
                str = `${startDatePart}_${endDatePart}_`;
            }
            return `Export_${str}${userName}_${formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;
        };

        setAuditing(true);

        // Handle time range logic
        const dateRange = filters.dateRange || [];
        let originalStart = dateRange[0];
        let originalEnd = dateRange[1];

        let adjustedStart = originalStart;
        let adjustedEnd = originalEnd;
        let showToast = false;
        let toastMessage = '';

        // No time range selected
        if (!originalStart && !originalEnd) {
            adjustedEnd = new Date();
            adjustedStart = new Date(adjustedEnd.getTime() - 59 * 24 * 60 * 60 * 1000); // Last 60 days
            showToast = true;
            toastMessage = t('log.exportNoDateRange');
        }
        // Partial time selection (only start or end selected)
        else if (!originalStart || !originalEnd) {
            if (originalStart) {
                adjustedEnd = new Date(originalStart);
                adjustedEnd.setDate(adjustedEnd.getDate() + 59);
            } else {
                adjustedStart = new Date(originalEnd);
                adjustedStart.setDate(adjustedStart.getDate() - 59);
            }
            showToast = true;
            const formattedStart = formatDate(adjustedStart, 'yyyy-MM-dd');
            const formattedEnd = formatDate(adjustedEnd, 'yyyy-MM-dd');
            toastMessage = t('log.exportCustomDateRange', { start: formattedStart, end: formattedEnd });
        }
        // Time range selected, check span
        else {
            const diffTime = adjustedEnd.getTime() - adjustedStart.getTime();
            const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000)) + 1; // Total days including start and end dates
            if (diffDays > 60) {
                message({
                    variant: 'error',
                    description: t('log.exportDateRangeExceed'),
                })
                setAuditing(false);
                return;
            }
        }

        // Display toast message
        if (showToast) {
            message({
                variant: 'warning',
                description: toastMessage,
            })
        }

        // Generate request parameters
        const [start_date, end_date] = getStrTime([adjustedStart, adjustedEnd] as [Date, Date])

        exportCsvDataApi({
            flow_ids: filters.appName?.length ? filters.appName : undefined,
            user_ids: filters.userName?.[0]?.value || undefined,
            group_ids: filters.userGroup || undefined,
            start_date,
            end_date,
            feedback: filters.feedback || undefined,
            sensitive_status: filters.sensitive_status || undefined,
        }).then(async res => {
            const data = [
                [
                    t('log.csvHeaders.sessionId'),
                    t('log.csvHeaders.appName'),
                    t('log.csvHeaders.sessionCreationTime'),
                    t('log.csvHeaders.userName'),
                    t('log.csvHeaders.messageRole'),
                    t('log.csvHeaders.messageSendTime'),
                    t('log.csvHeaders.messageContent'),
                    t('log.csvHeaders.like'),
                    t('log.csvHeaders.dislike'),
                    t('log.csvHeaders.copy'),
                    t('log.csvHeaders.sensitiveStatus')
                ]
            ];

            const handleMessage = (msg, category, id) => {
                try {
                    msg = msg && msg[0] === '{' ? JSON.parse(msg) : msg || ''
                } catch (error) {
                    console.error('error :>> ', `${id} ${t('log.messageConversionFailed')}`);
                }
                // output
                if ('output_with_input_msg' === category) return `${msg.msg} :${msg.hisValue}`
                if ('output_with_choose_msg' === category) return `${msg.msg} :${msg.options.find(el => el.id === msg.hisValue)?.label}`
                const newMsg = typeof msg === 'string' ? msg : (msg.input || msg.msg)
                return /^[=+\-@]/.test(newMsg) ? "'" + newMsg : newMsg
            }

            // Data transformation
            res.data.forEach(item => {
                item.messages.forEach(msg => {
                    const { message, category } = msg
                    const usefulMsg = !['flow', 'tool_call', 'tool_result'].includes(category) && message
                    usefulMsg && data.push([
                        item.chat_id,
                        item.flow_name,
                        item.create_time.replace('T', ' '),
                        item.user_name,
                        msg.category === 'question' ? t('log.userRole') : t('log.aiRole'),
                        msg.create_time.replace('T', ' '),
                        handleMessage(message, msg.category, item.flow_id + '_' + item.chat_id),
                        msg.liked === 1 ? t('log.yes') : t('log.no'),
                        msg.liked === 2 ? t('log.yes') : t('log.no'),
                        msg.copied ? t('log.yes') : t('log.no'),
                        msg.sensitive_status === 1 ? t('log.no') : t('log.yes')
                    ])
                })
            })
            // Export to Excel
            const fileName = generateFileName(start_date, end_date, user.user_name);
            exportCsv(data, fileName, true)

            // await downloadFile(__APP_ENV__.BASE_URL + res.url, fileName);
            setAuditing(false);
        }).catch((error) => {
            setAuditing(false);
            // Optional: handle error cases
        });
    };


    return (
        <div className="relative">
            <Card 
                className="shadow-sm"
                bodyStyle={{ padding: '20px' }}
            >
                {/* 筛选区域 */}
                <div className="mb-4">
                    <Space wrap size="middle" className="w-full">
                        <FilterByApp 
                            value={filters.appName} 
                            placeholder={t('log.appName')} 
                            onChange={(value) => dispatch({ type: 'SET_FILTER', payload: { ['appName']: value } })} 
                        />
                        <FilterByUser 
                            value={filters.userName} 
                            placeholder={t('log.userName')} 
                            onChange={(value) => dispatch({ type: 'SET_FILTER', payload: { ['userName']: value } })} 
                        />
                        <FilterByUsergroup 
                            value={filters.userGroup} 
                            placeholder={t('log.userGroup')} 
                            onChange={(value) => dispatch({ type: 'SET_FILTER', payload: { ['userGroup']: value } })} 
                        />
                        <FilterByDate 
                            value={filters.dateRange as any} 
                            placeholders={[`${t('log.startDate')}`, `${t('log.endDate')}`]} 
                            onChange={(value) => dispatch({ type: 'SET_FILTER', payload: { ['dateRange']: value } })} 
                        />
                        <div className="w-[200px] relative">
                            <Select 
                                value={filters.feedback} 
                                onValueChange={(value) => dispatch({ type: 'SET_FILTER', payload: { ['feedback']: value } })}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder={t('log.userFeedbackPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent className="max-w-[200px] break-all">
                                    <SelectGroup>
                                        <SelectItem value={'like'}>{t('log.likeFeedback')}</SelectItem>
                                        <SelectItem value={'dislike'}>{t('log.dislikeFeedback')}</SelectItem>
                                        <SelectItem value={'copied'}>{t('log.copyFeedback')}</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        {appConfig.isPro && (
                            <div className="w-[200px] relative">
                                <Select 
                                    value={filters.sensitive_status} 
                                    onValueChange={(value) => dispatch({ type: 'SET_FILTER', payload: { ['sensitive_status']: value } })}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder={t('log.sensitiveReviewResult')} />
                                    </SelectTrigger>
                                    <SelectContent className="max-w-[200px] break-all">
                                        <SelectGroup>
                                            <SelectItem value={'2'}>{t('log.sensitiveViolation')}</SelectItem>
                                            <SelectItem value={'1'}>{t('log.sensitivePass')}</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <AntdButton 
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                const dateRange = filters.dateRange || [];
                                let originalStart = dateRange[0];
                                let originalEnd = dateRange[1];
                                let adjustedStart = originalStart;
                                let adjustedEnd = originalEnd;
                                if (originalStart && !originalEnd) {
                                    adjustedEnd = undefined;
                                } else if (!originalStart && originalEnd) {
                                    adjustedStart = undefined;
                                }
                                filterData({ ...filters, dateRange: [adjustedStart, adjustedEnd] as any });
                            }}
                        >
                            {t('log.searchButton')}
                        </AntdButton>
                        <AntdButton 
                            onClick={resetClick}
                        >
                            {t('log.resetButton')}
                        </AntdButton>
                        <AntdButton 
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                            loading={auditing}
                        >
                            {t('log.exportButton')}
                        </AntdButton>
                    </Space>
                </div>

                {/* 表格区域 */}
                <div className="bg-white rounded-lg">
                    <Table
                        columns={columns}
                        dataSource={processedData}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                    />
                </div>
            </Card>
            <div className="bisheng-table-footer px-6 bg-background-login">
                <p className="desc"></p>
                <div>
                    <AutoPagination
                        page={page}
                        showJumpInput
                        jumpToText={t('log.pagination.jumpTo')}
                        pageText={t('log.pagination.page')}
                        pageSize={pageSize}
                        total={total}
                        onChange={(newPage) => setPage(newPage)}
                    />
                </div>
            </div>
        </div>
    );
};
