import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Dropdown, Avatar, message } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useStore } from '../store';
import { useEffect } from 'react';
import { api } from '../api';

const { Content } = Layout;

const tabs = [
  { key: '/', icon: <HomeOutlined style={{ fontSize: 20 }} />, label: '首页' },
  { key: '/items', icon: <AppstoreOutlined style={{ fontSize: 20 }} />, label: '物品' },
  { key: 'add', icon: <PlusOutlined style={{ fontSize: 24 }} />, label: '' },
  { key: '/stats', icon: <BarChartOutlined style={{ fontSize: 20 }} />, label: '统计' },
  { key: '/settings', icon: <SettingOutlined style={{ fontSize: 20 }} />, label: '设置' },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, setUser } = useStore();

  useEffect(() => {
    if (!user) {
      api.get('/auth/me').then((res) => setUser(res.data)).catch(() => { });
    }
  }, [user, setUser]);

  const handleLogout = () => {
    logout();
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'email', label: user?.email || '', disabled: true },
    { key: 'changePwd', label: '修改密码', icon: <EditOutlined />, },
    { type: 'divider', },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
  ];

  const currentPath = location.pathname;
  const activeKey = currentPath === '/' ? '/' : currentPath.startsWith('/items') ? '/items' : currentPath;

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--botw-bg)' }}>
      {/* 顶部标题栏 - 固定定位 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'var(--botw-bg)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--botw-card)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px var(--botw-shadow)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              <img src="/src/assets/zelda.webp" alt="zelda" style={{ width: 45, height: 45, objectFit: 'contain' }} />
            </div>
            <div>
              <div
                style={{
                  color: 'var(--botw-gold)',
                  fontSize: 20,
                  fontWeight: 'bold',
                  letterSpacing: 2,
                  lineHeight: 1.2,
                }}
              >
                海拉鲁物资录
              </div>
              <div style={{ color: 'var(--botw-text-muted)', fontSize: 11, lineHeight: 1.2 }}>
                ♛ 希卡石板 · 旷野之息名录
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                padding: '4px 14px',
                background: 'var(--botw-nav)',
                borderRadius: '16px',
                border: '1px solid var(--botw-gold)',
                color: 'var(--botw-gold)',
                fontSize: 12,
              }}
            >
              古代遗物 | 三角之力
            </div>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout();
                },
              }}
              placement="bottomRight"
            >
              <div
                style={{
                  color: 'var(--botw-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ background: 'var(--botw-gold)', color: 'var(--botw-nav)' }}
                />
              </div>
            </Dropdown>
          </div>
        </div>
      </div>
      {/* 内容区 - 为固定header留出顶部空间 */}
      <Content style={{ padding: '88px 12px 12px', background: 'var(--botw-bg)', overflow: 'auto', flex: 1 }}>
        <Outlet />
      </Content>

      {/* 底部导航 */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
          background: 'var(--botw-nav)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0 16px',
          borderTop: '1px solid rgba(201, 168, 76, 0.2)',
        }}
      >
        {tabs.map((tab) => {
          if (tab.key === 'add') {
            return (
              <div
                key={tab.key}
                onClick={() => navigate('/items/new')}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--botw-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(201, 168, 76, 0.4)',
                  marginTop: -20,
                  border: '3px solid var(--botw-nav)',
                  color: 'var(--botw-nav)',
                }}
              >
                {tab.icon}
              </div>
            );
          }
          const isActive = activeKey === tab.key;
          return (
            <div
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: '4px 16px',
                color: isActive ? 'var(--botw-gold)' : 'var(--botw-text-muted)',
                transition: 'color 0.2s',
              }}
            >
              {tab.icon}
              <span style={{ fontSize: 11 }}>{tab.label}</span>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
