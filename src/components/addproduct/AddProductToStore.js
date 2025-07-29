import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Row,
  Col,
  message,
  Select,
  AutoComplete,
  Divider,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  useCreateProductToStoreMutation,
} from "../../context/service/store.service";
import { useGetAllProductsQuery } from "../../context/service/addproduct.service";

const { Option } = Select;

const AddProductToStore = ({ refetchProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [barcode, setBarcode] = useState("");
  const [createProduct] = useCreateProductToStoreMutation();
  const { data: allProducts } = useGetAllProductsQuery();
  const [productNames, setProductNames] = useState([]);
  const [models, setModels] = useState([]);
  const [brandNames, setBrandNames] = useState([]);
  const [kimdan_kelgan, setKimdanKelgan] = useState([]);

  useEffect(() => {
    if (isModalOpen) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setBarcode(code);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (allProducts) {
      setProductNames([...new Set(allProducts.map((p) => p.product_name))]);
      setModels([...new Set(allProducts.map((p) => p.model))]);
      setBrandNames([...new Set(allProducts.map((p) => p.brand_name))]);
      setKimdanKelgan([...new Set(allProducts.map((p) => p.kimdan_kelgan))]);
    }
  }, [allProducts]);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    try {
      const payload = {
        ...values,
        barcode,
        purchase_currency: values.currency,
        currency: values.currency,
      };

      await createProduct(payload).unwrap();
      message.success("Mahsulot muvaffaqiyatli qo'shildi!");
      setIsModalOpen(false);
      form.resetFields();
      refetchProducts();
    } catch (err) {
      message.error("Xatolik yuz berdi. Qayta urinib ko'ring");
    }
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={showModal}
        style={{
          backgroundColor: "#52c41a",
          borderColor: "#52c41a",
          marginBottom: "10px",
        }}
        icon={<PlusOutlined />}
      >
        Dokonga Mahsulot qo'shish +
      </Button>

      <Modal
        title="Mahsulot yaratish va dokonga qo'shish"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        {/* Barcode uchun alohida forma */}
        <Form
          layout="inline"
          onFinish={() => {
            form.setFieldsValue({ barcode }); // asosiy forma uchun barcode ni set qilamiz
          }}
        >
          <Form.Item>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Shtrix kod"
              autoFocus
            />
          </Form.Item>
          <Form.Item>
            <Button
              onClick={() => {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                setBarcode(code);
              }}
            >
              Barcode yaratish
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <Form layout="vertical" form={form} onFinish={handleFinish}>
          {/* barcode ni asosiy forma ichiga uzatamiz */}
          <Form.Item name="barcode" initialValue={barcode} hidden>
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mahsulot nomi"
                name="product_name"
                rules={[{ required: true }]}
              >
                <AutoComplete options={productNames.map((v) => ({ value: v }))}>
                  <Input placeholder="Mahsulot nomi" />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Model"
                name="model"
                rules={[{ required: true }]}
              >
                <AutoComplete options={models.map((v) => ({ value: v }))}>
                  <Input placeholder="Model" />
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Miqdor"
                name="stock"
                rules={[{ required: true }]}
              >
                <Input type="number" placeholder="Miqdor" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="O'lchov birligi"
                name="count_type"
                rules={[{ required: true }]}
              >
                <Select placeholder="O'lchov birligi">
                  <Option value="dona">Dona</Option>
                  <Option value="komplekt">Karobka</Option>
                  <Option value="litr">Litr</Option>
                  <Option value="sm">Sm</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sotib olish narxi"
                name="purchase_price"
                rules={[{ required: true }]}
              >
                <Input type="number" placeholder="Sotib olish narxi" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Sotish narxi"
                name="sell_price"
                rules={[{ required: true }]}
              >
                <Input type="number" placeholder="Sotish narxi" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Narx valyutasi"
                name="currency"
                initialValue="usd"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="usd">USD</Option>
                  <Option value="sum">SUM</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Brend nomi" name="brand_name">
                <AutoComplete options={brandNames.map((v) => ({ value: v }))}>
                  <Input placeholder="Brend nomi" />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Kimdan kelgan"
                name="kimdan_kelgan"
                rules={[{ required: true }]}
              >
                <AutoComplete options={kimdan_kelgan.map((v) => ({ value: v }))}>
                  <Input placeholder="Kimdan kelgan" />
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>

          <Row>
            <Col span={24}>
              <Form.Item label="Maxsus eslatmalar" name="special_notes">
                <Input.TextArea placeholder="Maxsus eslatmalar" rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Saqlash
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddProductToStore;
