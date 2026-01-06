import { BookOpenIcon } from '@/components/bs-icons/bookOpen';
import { GithubIcon } from '@/components/bs-icons/github';
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import json from "../../../package.json";
import { useToast } from "@/components/bs-ui/toast/use-toast";
import { useNavigate, useLocation } from 'react-router-dom';
import { getCaptchaApi, loginApi /*, registerApi */ } from "../../controllers/API/user";
import { captureAndAlertRequestErrorHoc } from "../../controllers/request";
import LoginBridge from './loginBridge';
import { PWD_RULE, handleEncrypt, handleLdapEncrypt } from './utils';
import { locationContext } from '@/contexts/locationContext';
import { ldapLoginApi } from '@/controllers/API/pro';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Typography, 
    Space, 
    Divider,
    message as antdMessage,
    Row,
    Col
} from 'antd';
import { 
    UserOutlined, 
    LockOutlined, 
    SafetyOutlined,
    LoginOutlined
    // UserAddOutlined
} from '@ant-design/icons';
import './login.css';

const { Title, Text, Link } = Typography;

export const LoginPage = () => {
    const { t } = useTranslation();
    const { message } = useToast();
    const navigate = useNavigate();
    const { appConfig } = useContext(locationContext);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    // const [registerForm] = Form.useForm();

    // login or register
    // const [showLogin, setShowLogin] = useState(true);

    // captcha
    const [captchaData, setCaptchaData] = useState({ 
        captcha_key: '', 
        user_capthca: false, 
        captcha: '' 
    });

    useEffect(() => {
        fetchCaptchaData();
    }, []);

    const fetchCaptchaData = () => {
        getCaptchaApi().then(setCaptchaData);
    };

    const [isLDAP, setIsLDAP] = useState(false);

    const handleLogin = async (values: any) => {
        const { email, password, captcha } = values;
        setLoading(true);

        try {
            const encryptPwd = isLDAP 
                ? await handleLdapEncrypt(password) 
                : await handleEncrypt(password);
            
            const loginResponse: any = isLDAP
                ? await ldapLoginApi(email, encryptPwd)
                : await loginApi(email, encryptPwd, captchaData.captcha_key, captcha);

            window.self === window.top 
                ? localStorage.removeItem('ws_token') 
                : localStorage.setItem('ws_token', loginResponse.access_token);
            localStorage.setItem('isLogin', '1');

            // 修复登录重定向逻辑
            const pathname = localStorage.getItem('LOGIN_PATHNAME');
            if (pathname) {
                localStorage.removeItem('LOGIN_PATHNAME');
                location.href = pathname;
            } else {
                // 登录成功后统一重定向到 /workspace/，避免停留在404等错误页面
                location.href = location.origin + '/workspace/';
            }

            fetchCaptchaData();
        } catch (error: any) {
            if (error?.message?.indexOf('过期') !== -1) {
                localStorage.setItem('account', email);
                navigate('/reset', { state: { noback: true } });
            } else {
                antdMessage.error(error?.message || t('login.loginFailed'));
            }
            fetchCaptchaData();
        } finally {
            setLoading(false);
        }
    };

    // const handleRegister = async (values: any) => {
    //     const { email, password, confirmPassword, captcha } = values;
    //     setLoading(true);

    //     try {
    //         const encryptPwd = await handleEncrypt(password);
    //         await registerApi(email, encryptPwd, captchaData.captcha_key, captcha);
            
    //         antdMessage.success(t('login.registrationSuccess'));
    //         registerForm.resetFields();
    //         setShowLogin(true);
    //         fetchCaptchaData();
    //     } catch (error: any) {
    //         antdMessage.error(error?.message || t('login.registrationFailed'));
    //         fetchCaptchaData();
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    return (
        <div className="login-container">
            <div 
                className="login-background"
                style={{
                    // @ts-ignore - __APP_ENV__ is defined by vite.config.mts
                    backgroundImage: `url(${__APP_ENV__.BASE_URL}/bg.jpg)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <Row justify="end" align="middle" className="login-content-wrapper">
                    <Col xs={24} sm={20} md={18} lg={10} xl={8}>
                        <Card 
                            className="login-card"
                            bordered={false}
                            style={{
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                                backdropFilter: 'blur(10px)',
                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                            }}
                        >
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                {/* Logo 和公司信息 */}
                                <div className="login-header">
                                    {/* @ts-ignore - __APP_ENV__ is defined by vite.config.mts */}
                                    <img 
                                        src={__APP_ENV__.BASE_URL + '/login-logo-small.png'} 
                                        className="login-logo" 
                                        alt="恒创智能" 
                                    />
                                    <Title 
                                        level={2} 
                                        style={{ 
                                            margin: '24px 0 0 0', 
                                            textAlign: 'center', 
                                            fontWeight: 500,
                                            fontSize: '20px',
                                            color: '#1890ff'
                                        }}
                                    >
                                        <Link 
                                            href="https://www.hc-znzb.com/" 
                                            target="_blank"
                                            style={{ color: '#1890ff' }}
                                        >
                                            安徽恒创智能装备有限公司
                                        </Link>
                                    </Title>
                                </div>

                                <Divider style={{ margin: '8px 0' }} />

                                {/* 登录表单 */}
                                <Form
                                    form={form}
                                    name="login"
                                    onFinish={handleLogin}
                                    layout="vertical"
                                    size="large"
                                    autoComplete="off"
                                >
                                    <Form.Item
                                        name="email"
                                        rules={[
                                            { required: true, message: t('login.pleaseEnterAccount') }
                                        ]}
                                    >
                                        <Input
                                            prefix={<UserOutlined />}
                                            placeholder={t('login.account')}
                                            autoComplete="email"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[
                                            { required: true, message: t('login.pleaseEnterPassword') }
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder={t('login.password')}
                                            autoComplete="current-password"
                                            onPressEnter={() => form.submit()}
                                        />
                                    </Form.Item>

                                    {captchaData.user_capthca && (
                                        <Form.Item
                                            name="captcha"
                                            rules={[
                                                { required: true, message: t('login.pleaseEnterCaptcha') }
                                            ]}
                                        >
                                            <Space.Compact style={{ width: '100%' }}>
                                                <Input
                                                    prefix={<SafetyOutlined />}
                                                    placeholder={t('login.pleaseEnterCaptcha')}
                                                    style={{ flex: 1 }}
                                                />
                                                <div 
                                                    onClick={fetchCaptchaData}
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        border: '1px solid #d9d9d9',
                                                        borderRadius: '6px',
                                                        padding: '4px 8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        backgroundColor: '#fafafa'
                                                    }}
                                                >
                                                    <img
                                                        src={'data:image/jpg;base64,' + captchaData.captcha}
                                                        alt="captcha"
                                                        style={{ 
                                                            height: '32px',
                                                            width: 'auto'
                                                        }}
                                                    />
                                                </div>
                                            </Space.Compact>
                                        </Form.Item>
                                    )}

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            icon={<LoginOutlined />}
                                            style={{
                                                height: '48px',
                                                fontSize: '16px',
                                                fontWeight: 500
                                            }}
                                        >
                                            {t('login.loginButton')}
                                        </Button>
                                    </Form.Item>

                                    {/* 注册功能已注释 */}
                                    {/* {appConfig.register && (
                                        <div style={{ textAlign: 'center' }}>
                                            <Text type="secondary">
                                                还没有账号？{' '}
                                                <Link 
                                                    onClick={() => setShowLogin(false)}
                                                    style={{ fontWeight: 500 }}
                                                >
                                                    {t('login.noAccountRegister')}
                                                </Link>
                                            </Text>
                                        </div>
                                    )} */}

                                    {appConfig.isPro && (
                                        <Form.Item style={{ marginBottom: 0 }}>
                                            <LoginBridge onHasLdap={setIsLDAP} />
                                        </Form.Item>
                                    )}
                                </Form>
                                {/* ) : (
                                    <Form
                                        form={registerForm}
                                        name="register"
                                        onFinish={handleRegister}
                                        layout="vertical"
                                        size="large"
                                        autoComplete="off"
                                    >
                                        <Form.Item
                                            name="email"
                                            rules={[
                                                { required: true, message: t('login.pleaseEnterAccount') },
                                                { min: 3, message: t('login.accountTooShort') }
                                            ]}
                                        >
                                            <Input
                                                prefix={<UserOutlined />}
                                                placeholder={t('login.account')}
                                                autoComplete="email"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="password"
                                            rules={[
                                                { required: true, message: t('login.pleaseEnterPassword') },
                                                { min: 8, message: t('login.passwordTooShort') },
                                                { pattern: PWD_RULE, message: t('login.passwordError') }
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined />}
                                                placeholder={t('login.password')}
                                                autoComplete="new-password"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="confirmPassword"
                                            dependencies={['password']}
                                            rules={[
                                                { required: true, message: t('login.confirmPassword') },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        if (!value || getFieldValue('password') === value) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error(t('login.passwordMismatch')));
                                                    },
                                                }),
                                            ]}
                                        >
                                            <Input.Password
                                                prefix={<LockOutlined />}
                                                placeholder={t('login.confirmPassword')}
                                                autoComplete="new-password"
                                            />
                                        </Form.Item>

                                        {captchaData.user_capthca && (
                                            <Form.Item
                                                name="captcha"
                                                rules={[
                                                    { required: true, message: t('login.pleaseEnterCaptcha') }
                                                ]}
                                            >
                                                <Space.Compact style={{ width: '100%' }}>
                                                    <Input
                                                        prefix={<SafetyOutlined />}
                                                        placeholder={t('login.pleaseEnterCaptcha')}
                                                        style={{ flex: 1 }}
                                                    />
                                                    <div 
                                                        onClick={fetchCaptchaData}
                                                        style={{ 
                                                            cursor: 'pointer',
                                                            border: '1px solid #d9d9d9',
                                                            borderRadius: '6px',
                                                            padding: '4px 8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            backgroundColor: '#fafafa'
                                                        }}
                                                    >
                                                        <img
                                                            src={'data:image/jpg;base64,' + captchaData.captcha}
                                                            alt="captcha"
                                                            style={{ 
                                                                height: '32px',
                                                                width: 'auto'
                                                            }}
                                                        />
                                                    </div>
                                                </Space.Compact>
                                            </Form.Item>
                                        )}

                                        <Form.Item>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                block
                                                loading={loading}
                                                icon={<UserAddOutlined />}
                                                style={{
                                                    height: '48px',
                                                    fontSize: '16px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                {t('login.registerButton')}
                                            </Button>
                                        </Form.Item>

                                        <div style={{ textAlign: 'center' }}>
                                            <Text type="secondary">
                                                已有账号？{' '}
                                                <Link 
                                                    onClick={() => setShowLogin(true)}
                                                    style={{ fontWeight: 500 }}
                                                >
                                                    {t('login.haveAccountLogin')}
                                                </Link>
                                            </Text>
                                        </div>
                                    </Form>
                                )} */}

                                {/* 版本信息 */}
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        v{json.version}
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export const useLoginError = () => {
    const location = useLocation();
    const { toast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('status_code');
        if (code) {
            toast({
                variant: 'error',
                description: t('errors.' + code)
            });
        }
    }, [location]);
};
