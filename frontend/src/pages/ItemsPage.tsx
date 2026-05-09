import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Button, Popconfirm, message, Checkbox, Modal, Select, Tag, Space,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined,
} from '@ant-design/icons';
import { api } from '../api';

interface Item {
  id: number;
  name: string;
  price: number;
  status: string;
  purchase_date: string;
  category: { name: string };
  tags: { id: number; name: string }[];
  image_url: string;
}

interface Category {
  id: number;
  name: string;
}

interface TagType {
  id: number;
  name: string;
}

export default function ItemsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [batchCategoryVisible, setBatchCategoryVisible] = useState(false);
  const [batchTagsVisible, setBatchTagsVisible] = useState(false);
  const [batchCategoryId, setBatchCategoryId] = useState<number | null>(null);
  const [batchTagIds, setBatchTagIds] = useState<number[]>([]);

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
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/tags').then((res) => setTags(res.data));
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/items/${id}`);
      message.success('删除成功');
      fetchItems();
    } catch {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    try {
      await api.delete('/items/batch', { data: { ids: selectedIds } });
      message.success('批量删除成功');
      setSelectedIds([]);
      setEditMode(false);
      fetchItems();
    } catch {
      message.error('批量删除失败');
    }
  };

  const handleBatchCategory = async () => {
    if (!batchCategoryId) return;
    try {
      await api.put('/items/batch/category', { ids: selectedIds, categoryId: batchCategoryId });
      message.success('修改分类成功');
      setBatchCategoryVisible(false);
      setSelectedIds([]);
      setEditMode(false);
      fetchItems();
    } catch {
      message.error('修改分类失败');
    }
  };

  const handleBatchTags = async () => {
    try {
      await api.put('/items/batch/tags', { ids: selectedIds, tagIds: batchTagIds });
      message.success('修改标签成功');
      setBatchTagsVisible(false);
      setSelectedIds([]);
      setEditMode(false);
      fetchItems();
    } catch {
      message.error('修改标签失败');
    }
  };

  const columns = [
    {
      title: editMode ? (
        <Checkbox
          checked={selectedIds.length === items.length && items.length > 0}
          indeterminate={selectedIds.length > 0 && selectedIds.length < items.length}
          onChange={toggleSelectAll}
        />
      ) : '',
      key: 'select',
      width: 50,
      render: (_: any, record: Item) =>
        editMode ? (
          <Checkbox
            checked={selectedIds.includes(record.id)}
            onChange={() => toggleSelect(record.id)}
          />
        ) : null,
    },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '分类',
      key: 'category',
      render: (_: any, record: Item) => record.category?.name || '-',
    },
    { title: '价格', dataIndex: 'price', key: 'price', render: (v: number) => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status' },
    {
      title: '购入日期',
      dataIndex: 'purchase_date',
      key: 'purchase_date',
      render: (v: string) => v || '-',
    },
    {
      title: '标签',
      key: 'tags',
      render: (_: any, record: Item) =>
        record.tags?.map((t) => <Tag key={t.id} size="small">{t.name}</Tag>),
    },
    {
      title: '操作',
      key: 'action',
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
        <Button onClick={() => { setEditMode(!editMode); setSelectedIds([]); }}>
          {editMode ? '取消' : '编辑'}
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

      {editMode && selectedIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 60,
            left: 0,
            right: 0,
            background: '#fff',
            padding: 12,
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            zIndex: 20,
          }}
        >
          <span style={{ alignSelf: 'center', marginRight: 8 }}>
            已选 {selectedIds.length} 项
          </span>
          <Button danger onClick={handleBatchDelete}>删除选中</Button>
          <Button onClick={() => setBatchCategoryVisible(true)}>修改分类</Button>
          <Button onClick={() => setBatchTagsVisible(true)}>修改标签</Button>
        </div>
      )}

      <Modal
        open={batchCategoryVisible}
        title="批量修改分类"
        onOk={handleBatchCategory}
        onCancel={() => setBatchCategoryVisible(false)}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="选择分类"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(v) => setBatchCategoryId(v)}
        />
      </Modal>

      <Modal
        open={batchTagsVisible}
        title="批量修改标签"
        onOk={handleBatchTags}
        onCancel={() => setBatchTagsVisible(false)}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择标签"
          options={tags.map((t) => ({ value: t.id, label: t.name }))}
          onChange={(v) => setBatchTagIds(v)}
        />
      </Modal>
    </div>
  );
}
