import { useState, useCallback } from 'react';
import {
  Modal, Upload, Button, message, Spin, Input, InputNumber, Select, Image,
} from 'antd';
import { UploadOutlined, CloudUploadOutlined, ScanOutlined } from '@ant-design/icons';
import { api } from '../api';
import { compressImage } from '../utils/compressImage';
import dayjs from 'dayjs';

interface Category {
  id: number;
  name: string;
}

interface BatchItem {
  id: number; // local id
  file: File;
  preview: string;
  name: string;
  category_id: number | null;
  price: number;
  description: string;
  status: string;
  source: string;
  purchase_date: string;
}

interface BatchAddModalProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}

let localIdCounter = 0;

export default function BatchAddModal({ open, onClose, categories, onSuccess }: BatchAddModalProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [recognizing, setRecognizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recognizeProgress, setRecognizeProgress] = useState('');

  const statusOptions = ['全新', '中古', '待维护'].map((s) => ({ value: s, label: s }));

  const handleUploadChange = useCallback(async (info: any) => {
    const rawFiles: File[] = info.fileList
      .map((f: any) => f.originFileObj as File)
      .filter(Boolean);

    if (rawFiles.length > 9) {
      message.warning('最多只能选择9张图片');
      return;
    }

    const compressed = await Promise.all(
      rawFiles.map(async (file) => {
        try {
          const f = await compressImage(file, 100);
          return {
            id: ++localIdCounter,
            file: f,
            preview: URL.createObjectURL(f),
            name: '',
            category_id: null,
            price: 0,
            description: '',
            status: '全新',
            source: '淘宝',
            purchase_date: dayjs().format('YYYY-MM-DD'),
          };
        } catch {
          message.error(`${file.name} 压缩失败`);
          return null;
        }
      })
    );

    setItems(compressed.filter(Boolean) as BatchItem[]);
  }, []);

  const handleRecognize = async () => {
    if (items.length === 0) {
      message.warning('请先上传图片');
      return;
    }
    setRecognizing(true);
    setRecognizeProgress('正在识别...');
    try {
      const fd = new FormData();
      items.forEach((item) => fd.append('images', item.file));
      const { data } = await api.post('/ai/recognize-batch', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated = items.map((item, idx) => {
        const r = data[idx] || {};
        const matchedCat = categories.find(
          (c) => c.name === r.categoryName || c.name.includes(r.categoryName) || r.categoryName?.includes(c.name)
        );
        return {
          ...item,
          name: r.name || item.name || '未知物品',
          category_id: matchedCat?.id || null,
          price: Number(r.price) || 0,
          description: r.description || '',
        };
      });
      setItems(updated);
      message.success('AI 识别完成');
    } catch {
      message.error('AI 识别失败');
    } finally {
      setRecognizing(false);
      setRecognizeProgress('');
    }
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      message.warning('没有可提交的物品');
      return;
    }
    const invalid = items.filter((i) => !i.name || !i.category_id);
    if (invalid.length > 0) {
      message.error(`有 ${invalid.length} 个物品缺少名称或分类，请补充`);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      const payload = items.map((item) => ({
        name: item.name,
        category_id: item.category_id,
        price: item.price,
        description: item.description,
        status: item.status,
        source: item.source,
        purchase_date: item.purchase_date,
      }));
      fd.append('items', JSON.stringify(payload));
      items.forEach((item) => fd.append('images', item.file));

      const { data } = await api.post('/items/batch-create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success(`成功添加 ${data.count} 个物品`);
      setItems([]);
      onSuccess();
      onClose();
    } catch {
      message.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = (id: number, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <Modal
      open={open}
      title="批量添加物品"
      onCancel={() => {
        setItems([]);
        onClose();
      }}
      width={720}
      footer={null}
      centered
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 上传区域 */}
        <div>
          <Upload
            accept="image/*"
            multiple
            maxCount={9}
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleUploadChange}
          >
            <Button icon={<UploadOutlined />}>
              选择图片（最多9张）
            </Button>
          </Upload>
          <span style={{ marginLeft: 12, color: 'var(--botw-text-muted)', fontSize: 12 }}>
            已选 {items.length}/9 张
          </span>
        </div>

        {/* 操作按钮 */}
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Button
              icon={<ScanOutlined />}
              loading={recognizing}
              onClick={handleRecognize}
            >
              {recognizing ? recognizeProgress : 'AI 识别'}
            </Button>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              loading={submitting}
              onClick={handleSubmit}
            >
              提交入库
            </Button>
          </div>
        )}

        {/* 物品编辑列表 */}
        <Spin spinning={recognizing || submitting}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480, overflowY: 'auto' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: 12,
                  padding: 12,
                  background: 'var(--botw-card-light)',
                  borderRadius: 12,
                  border: '1px solid var(--botw-border)',
                }}
              >
                <Image
                  src={item.preview}
                  alt="preview"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Input
                    placeholder="名称"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    size="small"
                  />
                  <Select
                    placeholder="分类"
                    value={item.category_id || undefined}
                    onChange={(v) => updateItem(item.id, { category_id: v })}
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                    size="small"
                  />
                  <InputNumber
                    placeholder="价格"
                    value={item.price}
                    onChange={(v) => updateItem(item.id, { price: v || 0 })}
                    min={0}
                    precision={2}
                    size="small"
                    style={{ width: '100%' }}
                  />
                  <Select
                    placeholder="状态"
                    value={item.status}
                    onChange={(v) => updateItem(item.id, { status: v })}
                    options={statusOptions}
                    size="small"
                  />
                  <Input
                    placeholder="来源"
                    value={item.source}
                    onChange={(e) => updateItem(item.id, { source: e.target.value })}
                    size="small"
                  />
                  <Input
                    placeholder="购入日期"
                    type="date"
                    value={item.purchase_date}
                    onChange={(e) => updateItem(item.id, { purchase_date: e.target.value })}
                    size="small"
                  />
                  <Input
                    placeholder="描述"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    size="small"
                    style={{ gridColumn: '1 / -1' }}
                  />
                  <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                    <Button size="small" danger onClick={() => removeItem(item.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Spin>
      </div>
    </Modal>
  );
}
