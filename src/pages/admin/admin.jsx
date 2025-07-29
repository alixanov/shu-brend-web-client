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
  Tabs,
  Table,
  AutoComplete,
} from "antd";
import { Popconfirm } from "antd";
import "antd/dist/reset.css";
import { Option } from "antd/es/mentions";
import "./admin.css";
import {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useDeleteProductMutation,
  useUpdateProductMutation,
} from "../../context/service/addproduct.service";
import {
  PlusOutlined,
  UserAddOutlined,
  MoneyCollectOutlined,
  BarChartOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import Adminlar from "../Adminlar/Adminlar";
import Sotuv_tarix from "../sotuv-tarix/Sotuv_tarix";
import Qarzdor from "../qarzdorlar/Qarzdor";
import StoreItem from "../Store/StoreItem";
import Xisobot from "../Xisobod/Xisobot";
import EditProductModal from "../../components/modal/Editmodal";
import {
  useGetUsdRateQuery,
  useUpdateUsdRateMutation,
} from "../../context/service/usd.service";
import PrintBarcodeModal from "../../components/print/PrintBarcodeModal";
import { useAddProductToStoreMutation } from "../../context/service/store.service";
import SalesStatistics from "../SalesStatistics/SalesStatistics";
import { FaPrint } from "react-icons/fa";
import { BiTransfer } from "react-icons/bi";

export const Admin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form] = Form.useForm();
  const [createProduct] = useCreateProductMutation();
  const { data, error, isLoading, refetch } = useGetAllProductsQuery();
  const [barcode, setBarcode] = useState("");
  const [deleteProduct] = useDeleteProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [addProductToStore] = useAddProductToStoreMutation();
  const access = JSON.parse(localStorage.getItem("acsess"));
  const [editingProduct, setEditingProduct] = useState(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const { data: usdRateData } = useGetUsdRateQuery();
  const [updateUsdRate] = useUpdateUsdRateMutation();
  const [usdRate, setUsdRate] = useState(usdRateData?.rate || 1);
  const [productNames, setProductNames] = useState([]);
  const [brandNames, setBrandNames] = useState([]);
  const [kimdan_kelgan, setkimdan_kelgan] = useState([]);
  const [models, setModels] = useState([]);
  const [packingTypes, setPackingTypes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  useEffect(() => {
    if (usdRateData) {
      setUsdRate(usdRateData.rate);
    }
  }, [usdRateData]);

  useEffect(() => {
    if (data) {
      const profit = data.reduce((acc, product) => {
        const productProfit =
          (product.sell_price - product.purchase_price) * product.stock;
        return acc + productProfit;
      }, 0);
      setTotalProfit(profit);

      const uniqueProductNames = [
        ...new Set(data.map((product) => product.product_name)),
      ];
      setProductNames(uniqueProductNames.sort());

      const uniqueBrandNames = [
        ...new Set(data.map((product) => product.brand_name)),
      ];
      setBrandNames(uniqueBrandNames);

      const uniqueModels = [...new Set(data.map((product) => product.model))];
      setModels(uniqueModels);

      const uniquePackingTypes = [
        ...new Set(data.map((product) => product.packing_type)),
      ];
      const uniquekimdan_kelgan = [
        ...new Set(data.map((product) => product.kimdan_kelgan)),
      ];
      setkimdan_kelgan(uniquekimdan_kelgan);

      setPackingTypes(uniquePackingTypes);
    }
  }, [data]);

  useEffect(() => {
    if (isModalOpen) {
      const generateBarcode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setBarcode(code);
      };
      generateBarcode();
    }
  }, [isModalOpen]);

  const handleUsdRateChange = async () => {
    try {
      await updateUsdRate(usdRate).unwrap();
      message.success("USD kursi muvaffaqiyatli yangilandi!");
      refetch();
    } catch (error) {
      message.error("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  useEffect(() => {
    refetch();
  }, [usdRate]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    try {
      const productData = {
        ...values,
        barcode,
      };

      await createProduct(productData).unwrap();
      message.success("Mahsulot muvaffaqiyatli qo'shildi!");

      setIsModalOpen(false);
      form.resetFields();
      refetch();
      window.location.reload();
    } catch (error) {
      message.error("Xato yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  const showPrintModal = (barcode) => {
    setBarcode(barcode);
    setIsPrintModalOpen(true);
  };

  const handlePrintModalClose = () => {
    setIsPrintModalOpen(false);
  };

  const showEditModal = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditComplete = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    refetch();
  };

  const showTransferModal = (product) => {
    setSelectedProduct(product);
    setIsTransferModalOpen(true);
  };

  const handleTransferCancel = () => {
    setIsTransferModalOpen(false);
    setSelectedProduct(null);
    form.resetFields();
  };

  const handleAddToStore = async (values) => {
    try {
      // quantity ni raqamga aylantirish
      const quantity = Number(values.quantity);

      await addProductToStore({
        product_id: selectedProduct._id,
        quantity: quantity, // Raqam sifatida jo‘natiladi
      }).unwrap();

      message.success("Mahsulot do'konga muvaffaqiyatli o'tkazildi!");
      setIsTransferModalOpen(false);
      setSelectedProduct(null);
      refetch();
    } catch (error) {
      message.error("Mahsulotni do'konga o'tkazishda xatolik yuz berdi");
    }
  };

  const columns = [
    { title: "Mahsulot nomi", dataIndex: "product_name", key: "product_name" },
    { title: "Modeli", dataIndex: "model", key: "model" },
    {
      title: "Miqdor",
      dataIndex: "stock",
      key: "stock",
      render: (text) => (
        <div
          style={{
            backgroundColor:
              text === 0 ? "red" : text <= 5 ? "yellow" : "inherit",
            padding: "8px",
            textAlign: "center",
          }}
        >
          {Number(text).toLocaleString()}
        </div>
      ),
    },
    {
      title: "Katalogi",
      dataIndex: "product_category",
      key: "product_category",
    },
    {
      title: "Olish Narxi (USD)",
      dataIndex: "purchase_price",
      key: "purchase_price",
      render: (text) => `${text.toFixed(2)} USD`,
    },
    {
      title: "Sotish Narxi (USD)",
      dataIndex: "sell_price",
      key: "sell_price",
      render: (text) => `${text.toFixed(2)} USD`,
    },
    { title: "Brend nomi", dataIndex: "brand_name", key: "brand_name" },
    { title: "O'lchov birligi", dataIndex: "count_type", key: "count_type" },
    {
      title: "Shtrix kod",
      dataIndex: "barcode",
      key: "barcode",
      render: (barcode) => (
        <div>
          <Button
            onClick={() => showPrintModal(barcode)}
            type="primary"
            style={{ marginRight: "10px" }}
          >
            <FaPrint />
          </Button>
        </div>
      ),
    },
    {
      title: "kimdan_kelgan",
      dataIndex: "kimdan_kelgan",
      key: "kimdan_kelgan",
    },
    {
      title: "Umumiy Narxi (USD)",
      key: "total_price",
      render: (_, record) => {
        const totalPrice = record.sell_price * record.stock;
        return `${totalPrice.toFixed(2)} USD`;
      },
    },
    {
      title: "Foyda (USD)",
      key: "profit",
      render: (_, record) => {
        const profit =
          (record.sell_price - record.purchase_price) * record.stock;
        return `${profit.toFixed(2)} USD`;
      },
    },
    {
      title: "Amallar",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            style={{ marginRight: "10px" }}
            onClick={() => showEditModal(record)}
          >
            <EditOutlined />
          </Button>
          <Button
            type="primary"
            style={{ marginRight: "10px" }}
            onClick={() => showTransferModal(record)}
          >
            <BiTransfer />
          </Button>
          <Popconfirm
            title="Haqiqatdan ham ushbu mahsulotni o'chirmoqchimisiz?"
            onConfirm={() => handleDelete(record._id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button type="primary" danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id).unwrap();
      message.success("Mahsulot muvaffaqiyatli o'chirildi!");
      refetch();
    } catch (error) {
      message.error("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
  };

  const rowClassName = (record) => {
    if (record.stock === 0) {
      return "red-row";
    } else if (record.stock <= 5) {
      return "yellow-row";
    } else {
      return "";
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFilterChange = (value) => {
    setStockFilter(value);
  };

  // Filterlangan ma'lumotlarni tayyorlash
  const filteredData = data
    ?.filter((product) => {
      if (stockFilter === "all") return true;
      if (stockFilter === "runningOut")
        return product.stock <= 5 && product.stock > 0;
      if (stockFilter === "outOfStock") return product.stock === 0;
      return true;
    })
    .filter((product) => {
      const searchLower = searchText.toLowerCase();
      return (
        product.product_name.toLowerCase().includes(searchLower) ||
        product.model.toLowerCase().includes(searchLower) ||
        product.product_category.toLowerCase().includes(searchLower)
      );
    });

  // Default holatda teskari tartibda ko'rsatish uchun filteredData ni reverse qilamiz
  const reversedData = filteredData ? [...filteredData].reverse() : [];

  return (
    <div className="admin-container">
      <div className="admin-buttons"></div>
      <Modal
        title="Mahsulot yaratish"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mahsulot nomi"
                name="product_name"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <AutoComplete
                  options={productNames.map((name) => ({
                    value: name,
                  }))}
                  placeholder="Mahsulot nomi"
                  filterOption={(inputValue, option) =>
                    option.value
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) !== -1
                  }
                >
                  <Input placeholder="Mahsulot nomi" autoComplete="off" />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Model"
                name="model"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <AutoComplete
                  options={models.map((model) => ({
                    value: model,
                  }))}
                  placeholder="Model"
                  filterOption={(inputValue, option) =>
                    option.value
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) !== -1
                  }
                >
                  <Input placeholder="Model" autoComplete="off" />
                </AutoComplete>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Miqdor"
                name="stock"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <Input type="number" placeholder="Miqdor" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Katalogi"
                name="product_category"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <Input placeholder="Katalogi" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Sotib olish narxi (USD)"
                name="purchase_price"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <Input
                  type="number"
                  placeholder="Sotib olish narxi (USD)"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Sotish narxi (USD )"
                name="sell_price"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <Input
                  type="number"
                  placeholder="Sotish narxi (USD)"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Brend nomi"
                name="brand_name"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <AutoComplete
                  options={brandNames
                    .filter(
                      (brand) => brand != null && typeof brand === "string"
                    )
                    .map((brand) => ({ value: brand }))}
                  placeholder="Brend nomi"
                  filterOption={(inputValue, option) =>
                    option?.value
                      ?.toLowerCase?.()
                      .includes(inputValue.toLowerCase()) ?? false
                  }
                >
                  <Input placeholder="Brend nomi" autoComplete="off" />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="O'lchov birligi"
                name="count_type"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <Select placeholder="O'lchov birligi" autoComplete="off">
                  <Option value="dona">Dona</Option>
                  <Option value="komplekt">Komplekt</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Qadoq turi" name="packing_type">
                <AutoComplete
                  options={packingTypes
                    .filter((type) => type !== undefined && type !== null)
                    .map((type) => ({
                      value: type,
                    }))}
                  placeholder="Qadoq turi"
                  filterOption={(inputValue, option) =>
                    option &&
                    option.value
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) !== -1
                  }
                >
                  <Input placeholder="Qadoq turi" autoComplete="off" />
                </AutoComplete>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Shtrix kod"
                name="barcode"
                initialValue={barcode}
              >
                <Input placeholder="Shtrix kod" autoComplete="off" disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Maxsus eslatmalar" name="special_notes">
                <Input.TextArea
                  placeholder="Maxsus eslatmalar"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Kimdan kelgan"
                name="kimdan_kelgan"
                rules={[{ required: true, message: "Majburiy maydon!" }]}
              >
                <AutoComplete
                  options={kimdan_kelgan.map((kimdan) => ({
                    value: kimdan,
                  }))}
                  placeholder="Kimdan kelgan"
                  filterOption={(inputValue, option) =>
                    option.value
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) !== -1
                  }
                >
                  <Input placeholder="Kimdan kelgan" autoComplete="off" />
                </AutoComplete>
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

      <Modal
        title="Mahsulotni dokonga o'tkazish"
        open={isTransferModalOpen}
        onCancel={handleTransferCancel}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleAddToStore}>
          <Form.Item
            label="Miqdor"
            name="quantity"
            rules={[{ required: true, message: "Majburiy maydon!" }]}
          >
            <Input type="number" placeholder="Miqdor" autoComplete="off" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Dokonga o'tkazish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Tabs defaultActiveKey="1" style={{ flexGrow: 1, width: "100%" }}>
        {access?.dokon && (
          <Tabs.TabPane tab={<Button type="primary">Dokon</Button>} key="1">
            <StoreItem />
          </Tabs.TabPane>
        )}
        {/* {access?.skaladorlar && (
          <Tabs.TabPane
            tab={
              <Button type="primary" icon={<UserAddOutlined />}>
                Sklad tavar qo'shish
              </Button>
            }
            key="2"
          >
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
              Omborga Mahsulot qo'shish +
            </Button>
            <Input.Search
              placeholder="Mahsulot nomi, modeli yoki katalogi bo'yicha qidirish..."
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300, marginLeft: 20 }}
            />
            <Select
              defaultValue="all"
              style={{ width: 200, marginLeft: 20 }}
              onChange={handleFilterChange}
            >
              <Option value="all">Barcha mahsulotlar</Option>
              <Option value="runningOut">Tugayotgan mahsulotlar</Option>
              <Option value="outOfStock">Tugagan mahsulotlar</Option>
            </Select>
            <Table
              dataSource={reversedData?.filter(
                (st) => st?.storeProduct !== true
              )}
              loading={isLoading}
              columns={columns}
              pagination={{ pageSize: 20 }}
              rowClassName={rowClassName}
              scroll={{ x: "max-content" }}
            />
          </Tabs.TabPane>
        )} */}
        {access?.adminlar && (
          <Tabs.TabPane
            tab={
              <Button type="default" icon={<UserAddOutlined />}>
                Admin qo'shish
              </Button>
            }
            key="3"
          >
            <Adminlar />
          </Tabs.TabPane>
        )}
        {access?.qarzdorlar && (
          <Tabs.TabPane
            tab={
              <Button type="default" icon={<TeamOutlined />} danger>
                Qarzdorlar
              </Button>
            }
            key="4"
          >
            <Qarzdor />
          </Tabs.TabPane>
        )}
        {access?.xisobot && (
          <Tabs.TabPane
            tab={
              <Button type="primary" icon={<BarChartOutlined />}>
                Xisobot
              </Button>
            }
            key="5"
          >
            <Xisobot />
          </Tabs.TabPane>
        )}
        {access?.sotuv_tarixi && (
          <Tabs.TabPane
            tab={
              <Button type="primary" icon={<HistoryOutlined />}>
                Sotuv
              </Button>
            }
            key="6"
          >
            <Sotuv_tarix />
          </Tabs.TabPane>
        )}
        {access?.SalesStatistics && (
          <Tabs.TabPane
            tab={<Button type="primary">statistika</Button>}
            key="7"
          >
            <SalesStatistics />
          </Tabs.TabPane>
        )}
      </Tabs>

      <EditProductModal
        visible={isEditModalOpen}
        onCancel={handleEditComplete}
        product={editingProduct}
        usdRate={usdRate}
      />

      <PrintBarcodeModal
        visible={isPrintModalOpen}
        onCancel={handlePrintModalClose}
        barcode={barcode}
      />
    </div>
  );
};

export default Admin;
