import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Popconfirm, message, Space, Modal, Tag, Image,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

interface Item {
  id: number;
  name: string;
  price: number;
  status: string;
  source: string;
  purchase_date: string;
  expiry_date: string;
  location: string;
  description: string;
  image_url: string;
  category: { name: string };
  tags: { id: number; name: string }[];
  created_at: string;
  updated_at: string;
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/items', { params: { limit: 1000 } });
      setItems(data.data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/items/${id}`);
      message.success('删除成功');
      fetchItems();
    } catch {
      message.error('删除失败');
    }
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/items/${id}`);
      setDetailItem(data);
      setDetailVisible(true);
    } catch {
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string, record: Item) => (
        <Button type="link" onClick={() => openDetail(record.id)} style={{ padding: 0 }}>
          {v}
        </Button>
      ),
    },
    { title: '价格', dataIndex: 'price', key: 'price', sorter: (a: Item, b: Item) => a.price - b.price, render: (v: number) => `¥${v}` },
    {
      title: '购入日期',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      sorter: (a: Item, b: Item) => dayjs(a.purchase_date).valueOf() - dayjs(b.purchase_date).valueOf(),
      render: (v: string) => dayjs(v).format('YYYY-MM-DD') || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: Item) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/items/${record.id}/edit`)}
          />
          <Popconfirm
            title="确认删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/items/new')}>
          新增物品
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={items}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="small"
      />

      <Modal
        open={detailVisible}
        title={null}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={520}
        loading={detailLoading}
        centered
      >
        {detailItem && (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 16, alignItems: 'start' }}>
              {detailItem.image_url && (
                <Image
                  src={detailItem.image_url}
                  alt={detailItem.name}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                    borderRadius: 12,
                  }}
                />
              )}
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{detailItem.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>分类</span>
                    <div style={{ fontSize: 13 }}>{detailItem.category?.name || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>价格</span>
                    <div style={{ fontSize: 13, color: 'var(--botw-gold)', fontWeight: 'bold' }}>
                      ¥{detailItem.price?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>状态</span>
                    <div style={{ fontSize: 13 }}>{detailItem.status}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>来源</span>
                    <div style={{ fontSize: 13 }}>{detailItem.source || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>购入日期</span>
                    <div style={{ fontSize: 13 }}>{detailItem.purchase_date ? dayjs(detailItem.purchase_date).format('YYYY-MM-DD') : '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>过期日期</span>
                    <div style={{ fontSize: 13 }}>{detailItem.expiry_date ? dayjs(detailItem.expiry_date).format('YYYY-MM-DD') : '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>位置</span>
                    <div style={{ fontSize: 13 }}>{detailItem.location || '-'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>标签</span>
                    <div style={{ fontSize: 13 }}>
                      {detailItem.tags?.length
                        ? detailItem.tags.map((t) => <Tag key={t.id} style={{ fontSize: 11, padding: '0 6px', margin: 0 }}>{t.name}</Tag>)
                        : '-'}
                    </div>
                  </div>
                </div>
                {detailItem.description && (
                  <div>
                    <span style={{ color: 'var(--botw-text-muted)', fontSize: 11 }}>描述</span>
                    <div style={{ marginTop: 2, padding: 6, background: 'var(--botw-bg)', borderRadius: 6, fontSize: 12 }}>
                      {detailItem.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
