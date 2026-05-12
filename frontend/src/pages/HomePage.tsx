import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Badge, Spin, message, Empty, Modal, Image, Tag } from 'antd';
import {
  SearchOutlined,
  SettingOutlined,
  InboxOutlined,
  AppstoreOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

interface Category {
  id: number;
  name: string;
  show_on_home: boolean;
}

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
}

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchItems = useCallback(async (p = 1, catId?: number | null, q?: string) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 20 };
      if (catId) params.categoryId = catId;
      if (q) params.search = q;
      const { data } = await api.get('/items', { params });
      if (p === 1) {
        setItems(data.data);
      } else {
        setItems((prev) => [...prev, ...data.data]);
      }
      setTotalPages(data.totalPages);
    } catch {
      message.error('加载物品失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.filter((c: Category) => c.show_on_home)));
    api.get('/stats/overview').then((res) => setStats(res.data));
    fetchItems(1, null, '');
  }, [fetchItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchItems(1, selectedCategory, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, fetchItems]);

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

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* 搜索栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'var(--botw-card)',
          borderRadius: '24px',
          padding: '12px 16px',
          marginBottom: 16,
          boxShadow: '0 4px 12px var(--botw-shadow)',
        }}
      >
        <SearchOutlined style={{ color: 'var(--botw-gold)', fontSize: 18 }} />
        <Input
          placeholder="搜索食材、武器、防具、古代零件... 呀哈哈！"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          bordered={false}
          style={{
            background: 'transparent',
            color: 'var(--botw-text)',
            fontSize: 14,
            padding: '12 8',
          }}
        />
        <SettingOutlined
          style={{ color: 'var(--botw-gold)', fontSize: 18, cursor: 'pointer' }}
          onClick={() => navigate('/settings')}
        />
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {/* 总物品 */}
          <div
            style={{
              background: 'var(--botw-card)',
              borderRadius: '16px',
              padding: '14px 12px',
              boxShadow: '0 4px 12px var(--botw-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <InboxOutlined style={{ color: 'var(--botw-gold)', fontSize: 14 }} />
              <span style={{ color: 'var(--botw-text)', fontSize: 12 }}>总物品</span>
            </div>
            <div
              style={{
                color: 'var(--botw-gold)',
                fontSize: 28,
                fontWeight: 'bold',
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              {stats.totalItems?.toLocaleString()}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(201, 168, 76, 0.15)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: 11,
                color: 'var(--botw-gold)',
              }}
            >
              <ArrowUpOutlined style={{ fontSize: 10 }} />
              本月 +{stats.newItemsThisMonth}
            </div>
            <div style={{ color: 'var(--botw-text-muted)', fontSize: 10, marginTop: 6 }}>
              海拉鲁物资 · 呀哈哈珍藏
            </div>
          </div>

          {/* 总分类 */}
          <div
            style={{
              background: 'var(--botw-card)',
              borderRadius: '16px',
              padding: '14px 12px',
              boxShadow: '0 4px 12px var(--botw-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <AppstoreOutlined style={{ color: 'var(--botw-gold)', fontSize: 14 }} />
              <span style={{ color: 'var(--botw-text)', fontSize: 12 }}>总分类</span>
            </div>
            <div
              style={{
                color: 'var(--botw-gold)',
                fontSize: 28,
                fontWeight: 'bold',
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              {stats.totalCategories}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(201, 168, 76, 0.15)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: 11,
                color: 'var(--botw-gold)',
              }}
            >
              <ArrowUpOutlined style={{ fontSize: 10 }} />
              本月 +{stats.newCategoriesThisMonth}
            </div>
            <div style={{ color: 'var(--botw-text-muted)', fontSize: 10, marginTop: 6 }}>
              新增「古代科技」标签
            </div>
          </div>

          {/* 总估值 */}
          <div
            style={{
              background: 'var(--botw-card)',
              borderRadius: '16px',
              padding: '14px 12px',
              boxShadow: '0 4px 12px var(--botw-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <WalletOutlined style={{ color: 'var(--botw-gold)', fontSize: 14 }} />
              <span style={{ color: 'var(--botw-text)', fontSize: 12 }}>总估值</span>
            </div>
            <div
              style={{
                color: 'var(--botw-gold)',
                fontSize: 28,
                fontWeight: 'bold',
                lineHeight: 1.2,
                marginBottom: 6,
              }}
            >
              ¥{stats.totalValue}
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background:
                  stats.valueChangePercent >= 0
                    ? 'rgba(201, 168, 76, 0.15)'
                    : 'rgba(196, 92, 74, 0.15)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: 11,
                color: stats.valueChangePercent >= 0 ? 'var(--botw-gold)' : 'var(--botw-blue)',
              }}
            >
              {stats.valueChangePercent >= 0 ? (
                <ArrowUpOutlined style={{ fontSize: 10 }} />
              ) : (
                <ArrowDownOutlined style={{ fontSize: 10 }} />
              )}
              较上月 {stats.valueChangePercent >= 0 ? '+' : ''}
              {stats.valueChangePercent}%
            </div>
            <div style={{ color: 'var(--botw-text-muted)', fontSize: 10, marginTop: 6 }}>
              卢比资产 · 稳步增长
            </div>
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TagOutlined style={{ color: 'var(--botw-gold)', fontSize: 16 }} />
            <span
              style={{
                color: 'var(--botw-gold)',
                fontSize: 16,
                fontWeight: 'bold',
                letterSpacing: 1,
              }}
            >
              类别 · 英帕的卷轴
            </span>
          </div>
          <div
            onClick={() => navigate('/settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 12px',
              background: 'var(--botw-card)',
              borderRadius: '16px',
              color: 'var(--botw-gold)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <TagOutlined style={{ fontSize: 10 }} />
            管理分类
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: 13,
              cursor: 'pointer',
              background:
                selectedCategory === null ? 'var(--botw-gold)' : 'var(--botw-card)',
              color:
                selectedCategory === null ? 'var(--botw-nav)' : 'var(--botw-text)',
              border:
                selectedCategory === null
                  ? '2px solid var(--botw-gold)'
                  : '1px solid var(--botw-border)',
              transition: 'all 0.2s',
            }}
          >
            全部
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: 13,
                cursor: 'pointer',
                background:
                  selectedCategory === cat.id ? 'var(--botw-gold)' : 'var(--botw-card)',
                color:
                  selectedCategory === cat.id ? 'var(--botw-nav)' : 'var(--botw-text)',
                border:
                  selectedCategory === cat.id
                    ? '2px solid var(--botw-gold)'
                    : '1px solid var(--botw-border)',
                transition: 'all 0.2s',
              }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {/* 最近获得 */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <InboxOutlined style={{ color: 'var(--botw-gold)', fontSize: 16 }} />
            <span
              style={{
                color: 'var(--botw-gold)',
                fontSize: 16,
                fontWeight: 'bold',
                letterSpacing: 1,
              }}
            >
              最近获得
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 12px',
              background: 'var(--botw-card)',
              borderRadius: '16px',
              color: 'var(--botw-gold)',
              fontSize: 12,
            }}
          >
            <Badge color="var(--botw-green)" />
            新着 · {items.filter((i) => i.purchase_date && dayjs(i.purchase_date).isAfter(dayjs().subtract(30, 'day'))).length}件
          </div>
        </div>
      </div>

      {/* 物品卡片网格 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
        }}
        className="home-item-grid"
      >
        {items.map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => openDetail(item.id)}
              style={{
                background: 'var(--botw-card-light)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px var(--botw-shadow)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              {item.image_url && (
                <div style={{ position: 'relative' }}>
                  <img
                    alt={item.name}
                    src={item.image_url}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '2px 8px',
                      background: 'rgba(92, 83, 70, 0.85)',
                      borderRadius: '10px',
                      fontSize: 11,
                      color: 'var(--botw-gold)',
                    }}
                  >
                    {item.category?.name}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && !loading && (
        <Empty description="暂无物品" style={{ marginTop: 40 }} />
      )}

      {page < totalPages && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <div
            onClick={() => {
              setPage((p) => p + 1);
              fetchItems(page + 1, selectedCategory, search);
            }}
            style={{
              display: 'inline-block',
              padding: '8px 24px',
              background: 'var(--botw-card)',
              borderRadius: '20px',
              color: 'var(--botw-gold)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            加载更多
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Spin />
        </div>
      )}

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
