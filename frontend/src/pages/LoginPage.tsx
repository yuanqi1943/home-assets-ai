import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message, Tabs } from 'antd';
import { api } from '../api';
import { useStore } from '../store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useStore();
  const [loading, setLoading] = useState(false);

  const onLogin = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', values);
      setToken(data.access_token);
      setUser(data.user);
      message.success('登录成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: any) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        email: values.email,
        password: values.password,
      });
      setToken(data.access_token);
      setUser(data.user);
      message.success('注册成功');
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--botw-bg)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--botw-card)',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 8px 32px var(--botw-shadow)',
          border: '2px solid var(--botw-gold)',
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--botw-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32,
              boxShadow: '0 4px 12px rgba(201, 168, 76, 0.4)',
            }}
          >
            ▲
          </div>
          <div
            style={{
              color: 'var(--botw-gold)',
              fontSize: 24,
              fontWeight: 'bold',
              letterSpacing: 3,
              marginBottom: 4,
            }}
          >
            海拉鲁物资录
          </div>
          <div style={{ color: 'var(--botw-text-muted)', fontSize: 12 }}>
            ♛ 希卡石板 · 旷野之息名录
          </div>
        </div>

        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: 'login',
              label: (
                <span style={{ color: 'var(--botw-gold)', fontSize: 15, fontWeight: 600 }}>
                  登录
                </span>
              ),
              children: (
                <Form onFinish={onLogin} layout="vertical">
                  <Form.Item
                    name="email"
                    label={<span style={{ color: 'var(--botw-text)' }}>邮箱</span>}
                    rules={[{ required: true, type: 'email' }]}
                  >
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={<span style={{ color: 'var(--botw-text)' }}>密码</span>}
                    rules={[{ required: true, min: 6 }]}
                  >
                    <Input.Password placeholder="请输入密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{ height: 44, fontSize: 16 }}
                    >
                      ⚔️ 进入海拉鲁
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: (
                <span style={{ color: 'var(--botw-gold)', fontSize: 15, fontWeight: 600 }}>
                  注册
                </span>
              ),
              children: (
                <Form onFinish={onRegister} layout="vertical">
                  <Form.Item
                    name="email"
                    label={<span style={{ color: 'var(--botw-text)' }}>邮箱</span>}
                    rules={[{ required: true, type: 'email' }]}
                  >
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label={<span style={{ color: 'var(--botw-text)' }}>密码</span>}
                    rules={[{ required: true, min: 6 }]}
                  >
                    <Input.Password placeholder="请输入密码（至少6位）" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label={<span style={{ color: 'var(--botw-text)' }}>确认密码</span>}
                    rules={[{ required: true }]}
                  >
                    <Input.Password placeholder="请再次输入密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{ height: 44, fontSize: 16 }}
                    >
                      🛡️ 创建冒险者档案
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            color: 'var(--botw-text-muted)',
            fontSize: 11,
          }}
        >
          古代遗物 | 三角之力
        </div>
      </div>
    </div>
  );
}
