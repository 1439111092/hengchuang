import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import './locales/i18n';
import App from './App';
import './style.css';
import './mobile.css';
import './vditor.css';
// Ant Design 样式
// 注意：如果使用 antd 5.x，使用 'antd/dist/reset.css'
// 如果使用 antd 4.x，使用 'antd/dist/antd.css'
// 请根据实际安装的 antd 版本调整
import 'antd/dist/reset.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ApiErrorBoundaryProvider>
    <App />
  </ApiErrorBoundaryProvider>,
);
