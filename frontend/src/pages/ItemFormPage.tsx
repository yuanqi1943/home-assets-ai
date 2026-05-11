import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form, Input, Select, DatePicker, InputNumber, Button, Upload, message, Spin,
} from 'antd';
import { UploadOutlined, ScanOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';

interface Category {
  id: number;
  name: string;
}

interface TagType {
  id: number;
  name: string;
}

export default function ItemFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/tags').then((res) => setTags(res.data));
    if (id) {
      api.get(`/items/${id}`).then((res) => {
        const data = res.data;
        form.setFieldsValue({
          ...data,
          purchase_date: data.purchase_date ? dayjs(data.purchase_date) : null,
          expiry_date: data.expiry_date ? dayjs(data.expiry_date) : null,
          tag_ids: data.tags?.map((t: any) => t.id) || [],
        });
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      });
    }
  }, [id, form]);

  const compressImage = async (file: File, maxSizeKB = 200): Promise<File> => {
    const maxBytes = maxSizeKB * 1024;
    if (file.size <= maxBytes) return file;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'));
          return;
        }

        const tryCompress = (quality: number) => {
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }
              if (blob.size <= maxBytes || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // 降低质量重试
                tryCompress(quality - 0.1);
              }
            },
            'image/jpeg',
            quality
          );
        };

        // 如果尺寸过大，先等比缩小
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        tryCompress(0.9);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('图片加载失败'));
      };
      img.src = url;
    });
  };

  const handleImageChange = async (info: any) => {
    if (info.fileList.length > 0) {
      const rawFile = info.fileList[0].originFileObj as File;
      try {
        const file = await compressImage(rawFile, 200);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } catch {
        message.error('图片压缩失败');
        setImageFile(null);
        setImagePreview(null);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    try {
      const file = await compressImage(rawFile, 200);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      message.success('拍照成功');
    } catch {
      message.error('图片压缩失败');
    }
    e.target.value = '';
  };

  const handleAiRecognize = async () => {
    if (!imageFile) {
      message.warning('请先上传或拍摄图片');
      return;
    }
    setAiLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const { data } = await api.post('/ai/recognize', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      form.setFieldsValue({
        name: data.name || form.getFieldValue('name'),
        category_id: data.categoryId || form.getFieldValue('category_id'),
        description: data.description || form.getFieldValue('description'),
        price: data.price ?? form.getFieldValue('price'),
      });
      message.success('AI 识别成功');
    } catch {
      message.error('AI 识别失败');
    } finally {
      setAiLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', values.name);
      fd.append('category_id', values.category_id);
      if (values.purchase_date) {
        fd.append('purchase_date', values.purchase_date.format('YYYY-MM-DD'));
      }
      fd.append('price', String(values.price || 0));
      fd.append('status', values.status || '全新');
      if (values.source) fd.append('source', values.source);
      if (values.expiry_date) {
        fd.append('expiry_date', values.expiry_date.format('YYYY-MM-DD'));
      }
      if (values.location) fd.append('location', values.location);
      if (values.description) fd.append('description', values.description);
      if (values.tag_ids?.length) {
        values.tag_ids.forEach((tid: number) => fd.append('tag_ids', String(tid)));
      }
      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (id) {
        await api.put(`/items/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('更新成功');
      } else {
        await api.post('/items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        message.success('添加成功');
      }
      navigate('/items');
    } catch (err: any) {
      message.error(err.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['全新', '中古', '待维护'].map((s) => ({ value: s, label: s }));

  return (
    <div>
      {/* 返回按钮 */}
      <div
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          color: 'var(--botw-gold)',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        <ArrowLeftOutlined />
        返回
      </div>

      <div
        style={{
          background: 'var(--botw-card)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 12px var(--botw-shadow)',
        }}
      >
        <div
          style={{
            color: 'var(--botw-gold)',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            letterSpacing: 2,
          }}
        >
          {id ? '✦ 编辑遗物' : '✦ 新增遗物'}
        </div>

        <Spin spinning={loading}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item
              name="name"
              label={<span style={{ color: 'var(--botw-text)' }}>名称</span>}
              rules={[{ required: true }]}
            >
              <Input placeholder="如：希卡-咖啡萃取器" />
            </Form.Item>

            <Form.Item
              label={<span style={{ color: 'var(--botw-text)' }}>图片</span>}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Upload
                  accept="image/*"
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleImageChange}
                >
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
                {/* <Button
                  icon={<CameraOutlined />}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  拍照
                </Button> */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleCameraCapture}
                />
                <Button icon={<ScanOutlined />} loading={aiLoading} onClick={handleAiRecognize}>
                  AI 识别
                </Button>
              </div>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    marginTop: 10,
                    borderRadius: 12,
                    border: '2px solid var(--botw-gold)',
                  }}
                />
              )}
            </Form.Item>

            <Form.Item
              name="category_id"
              label={<span style={{ color: 'var(--botw-text)' }}>分类</span>}
              rules={[{ required: true }]}
            >
              <Select
                placeholder="选择分类"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>

            <Form.Item
              name="purchase_date"
              label={<span style={{ color: 'var(--botw-text)' }}>购入日期</span>}
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="price"
              label={<span style={{ color: 'var(--botw-text)' }}>价格 (¥)</span>}
            >
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="如：1280" />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span style={{ color: 'var(--botw-text)' }}>状态</span>}
              initialValue="全新"
            >
              <Select options={statusOptions} />
            </Form.Item>

            <Form.Item
              name="source"
              label={<span style={{ color: 'var(--botw-text)' }}>来源</span>}
              initialValue="淘宝"
            >
              <Input placeholder="如：哈特诺古代研究所、卡卡利科村" />
            </Form.Item>

            <Form.Item
              name="expiry_date"
              label={<span style={{ color: 'var(--botw-text)' }}>过期日期</span>}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="location"
              label={<span style={{ color: 'var(--botw-text)' }}>位置</span>}
            >
              <Input placeholder="如：客厅、书房、背包" />
            </Form.Item>

            <Form.Item
              name="description"
              label={<span style={{ color: 'var(--botw-text)' }}>描述</span>}
            >
              <Input.TextArea rows={3} maxLength={500} showCount placeholder="描述物品的特征..." />
            </Form.Item>

            <Form.Item
              name="tag_ids"
              label={<span style={{ color: 'var(--botw-text)' }}>标签</span>}
            >
              <Select
                mode="multiple"
                placeholder="选择标签"
                options={tags.map((t) => ({ value: t.id, label: t.name }))}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{
                  height: 44,
                  fontSize: 16,
                  borderRadius: '24px',
                }}
              >
                {id ? '💾 保存修改' : '⚔️ 提交新增'}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  );
}
