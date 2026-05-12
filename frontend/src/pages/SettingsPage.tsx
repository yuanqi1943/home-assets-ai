import { useEffect, useState } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Switch, Popconfirm, message, Tag, Divider,
} from 'antd';
import {
  ExportOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { api } from '../api';
import BatchAddModal from './BatchAddModal';
// import { useStore } from '../store';

interface Category {
  id: number;
  name: string;
  show_on_home: boolean;
  sort_order: number;
  is_default: boolean;
}

interface TagType {
  id: number;
  name: string;
}

export default function SettingsPage() {
  // const { user, logout } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catEditing, setCatEditing] = useState<Category | null>(null);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tagEditing, setTagEditing] = useState<TagType | null>(null);
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [catForm] = Form.useForm();
  const [tagForm] = Form.useForm();
  const [pwdForm] = Form.useForm();

  const fetchData = async () => {
    const [cRes, tRes] = await Promise.all([api.get('/categories'), api.get('/tags')]);
    setCategories(cRes.data);
    setTags(tRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveCategory = async (values: any) => {
    try {
      const payload = {
        ...values,
        sort_order: values.sort_order ? Number(values.sort_order) : 0,
      };
      if (catEditing) {
        await api.put(`/categories/${catEditing.id}`, payload);
        message.success('更新成功');
      } else {
        console.log(payload);
        await api.post('/categories', payload);
        message.success('添加成功');
      }
      setCatModalVisible(false);
      setCatEditing(null);
      catForm.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const saveTag = async (values: any) => {
    try {
      if (tagEditing) {
        await api.put(`/tags/${tagEditing.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/tags', values);
        message.success('添加成功');
      }
      setTagModalVisible(false);
      setTagEditing(null);
      tagForm.resetFields();
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const deleteTag = async (id: number) => {
    try {
      await api.delete(`/tags/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const exportCSV = async () => {
    try {
      const res = await api.get('/export/items', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'items.csv';
      link.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const changePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    message.success('密码修改功能暂未接入后端，演示用途');
    setPwdModalVisible(false);
    pwdForm.resetFields();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* <Card title="登录信息" size="small">
        <p>邮箱: {user?.email}</p>
        <Button size="small" onClick={() => setPwdModalVisible(true)}>修改密码</Button>
      </Card> */}

      <Card
        title="分类管理"
        size="small"
        extra={
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setCatEditing(null); catForm.resetFields(); setCatModalVisible(true); }}>
            添加分类
          </Button>
        }
      >
        <Table
          size="small"
          dataSource={categories}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '名称', dataIndex: 'name' },
            {
              title: '首页显示',
              dataIndex: 'show_on_home',
              render: (v: boolean, record: Category) => (
                <Switch
                  checked={v}
                  size="small"
                  onChange={async (checked) => {
                    console.log(checked)
                    await api.put(`/categories/${record.id}`, { show_on_home: checked });
                    fetchData();
                  }}
                />
              ),
            },
            { title: '排序', dataIndex: 'sort_order' },
            {
              title: '操作',
              key: 'action',
              render: (_: any, record: Category) => (
                <span>
                  <Button size="small" icon={<EditOutlined />} onClick={() => { setCatEditing(record); catForm.setFieldsValue(record); setCatModalVisible(true); }} />
                  <Popconfirm title="确认删除？" onConfirm={() => deleteCategory(record.id)}>
                    <Button size="small" danger icon={<DeleteOutlined />} style={{ marginLeft: 8 }} />
                  </Popconfirm>
                </span>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="标签管理"
        size="small"
        extra={
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setTagEditing(null); tagForm.resetFields(); setTagModalVisible(true); }}>
            添加标签
          </Button>
        }
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((t) => (
            <Tag key={t.id} closable onClose={() => deleteTag(t.id)}>
              <span onClick={() => { setTagEditing(t); tagForm.setFieldsValue(t); setTagModalVisible(true); }} style={{ cursor: 'pointer' }}>
                <EditOutlined style={{ fontSize: 10, marginRight: 4 }} />
                {t.name}
              </span>
            </Tag>
          ))}
        </div>
      </Card>

      <Card title="数据导出" size="small">
        <Button icon={<ExportOutlined />} onClick={exportCSV}>
          导出为 CSV
        </Button>
      </Card>

      <Card title="批量添加" size="small">
        <Button icon={<AppstoreAddOutlined />} onClick={() => setBatchModalVisible(true)}>
          批量添加物品
        </Button>
      </Card>

      <BatchAddModal
        open={batchModalVisible}
        onClose={() => setBatchModalVisible(false)}
        categories={categories}
        onSuccess={fetchData}
      />

      <Divider />
      {/* <Button danger block onClick={() => { logout(); window.location.href = '/login'; }}>
        退出登录
      </Button> */}

      <Modal
        open={catModalVisible}
        title={catEditing ? '编辑分类' : '添加分类'}
        onCancel={() => setCatModalVisible(false)}
        onOk={() => catForm.submit()}
      >
        <Form form={catForm} onFinish={saveCategory} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="show_on_home" label="首页显示" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="sort_order" label="排序">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={tagModalVisible}
        title={tagEditing ? '编辑标签' : '添加标签'}
        onCancel={() => setTagModalVisible(false)}
        onOk={() => tagForm.submit()}
      >
        <Form form={tagForm} onFinish={saveTag} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={pwdModalVisible}
        title="修改密码"
        onCancel={() => setPwdModalVisible(false)}
        onOk={() => pwdForm.submit()}
      >
        <Form form={pwdForm} onFinish={changePassword} layout="vertical">
          <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认新密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
