import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  message,
  Modal,
  Form,
  Space,
  Select,
  Popover,
} from "antd";
import {
  useGetDebtorsQuery,
  useUpdateDebtorMutation,
  useReturnProductDebtorMutation,
  useCreateDebtorMutation,
  useCreatePaymentMutation,
} from "../../context/service/debtor.service";
import moment from "moment";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { FaDollarSign } from "react-icons/fa";

export default function Qarzdor() {
  const { data: debtors = [], refetch } = useGetDebtorsQuery();
  const [updateDebtor] = useUpdateDebtorMutation();
  const [returnProduct] = useReturnProductDebtorMutation();
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [returnQuantities, setReturnQuantities] = useState({});
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createPayment] = useCreatePaymentMutation();
  const [paymentDebtor, setPaymentDebtor] = useState();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { data: usdRateData } = useGetUsdRateQuery();

  const formatNumber = (num, curr) => {
    const formatted = Number(num || 0).toLocaleString("uz-UZ");
    return curr === "usd" ? `${formatted} $` : `${formatted} so'm`;
  };

  const correctedPrice = (price, currency) => {
    if (currency === "usd" && price > 0 && price < 100) {
      return price * usdRateData.rate;
    }
    return price;
  };

  const correctedTotal = (price, quantity, currency) => {
    return correctedPrice(price, currency) * quantity;
  };

  const handlePay = async (debtorId, productId) => {
    const key = `${debtorId}_${productId}`;
    const amount = Number(paymentAmounts[key]);

    if (!amount || amount <= 0) {
      message.error("To'g'ri summa kiriting");
      return;
    }

    try {
      await updateDebtor({
        id: debtorId,
        paid_amount: amount,
        product_id: productId,
      }).unwrap();
      message.success("To‘lov saqlandi");
      setPaymentAmounts((prev) => ({ ...prev, [key]: "" }));
      refetch();
    } catch (err) {
      message.error("Xatolik: " + err?.data?.message);
    }
  };

  const handleReturn = async (debtorId, productId, index) => {
    const key = `${debtorId}_${productId}_${index}`;
    const quantityStr = returnQuantities[key];

    if (
      !quantityStr ||
      isNaN(Number(quantityStr)) ||
      Number(quantityStr) <= 0
    ) {
      message.error("Qaytariladigan miqdor noto‘g‘ri");
      return;
    }

    const quantity = Number(quantityStr);

    try {
      await returnProduct({
        id: debtorId,
        product_id: productId,
        quantity: quantity,
      }).unwrap();

      message.success("Qaytarildi");
      setReturnQuantities((prev) => ({ ...prev, [key]: "" }));
      setModalOpen(false);
      setSelectedDebtor(null);
      refetch();
    } catch (err) {
      message.error("Xatolik: " + err?.data?.message);
    }
  };

  const columns = [
    { title: "Ism", dataIndex: "name", key: "name" },
    { title: "Telefon", dataIndex: "phone", key: "phone" },
    {
      title: "Mahsulotlar",
      render: (_, record) => `${record.products?.length || 0} ta mahsulot`,
    },
    {
      title: "Jami qarz",
      render: (_, record) => {
        const rate = Number(usdRateData?.rate || 1);
        const amount = Number(record.debt_amount || 0);
        console.log(amount);

        const isUsd = record.currency === "usd";
        console.log(record.currency);

        const total = isUsd ? amount * rate : amount;
        return `${total.toLocaleString("uz-UZ")} so'm`;
      },
    },
    {
      title: "Amallar",
      render: (_, record) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedDebtor(record);
              setModalOpen(true);
            }}
          >
            Batafsil
          </Button>

          <Button
            type="primary"
            onClick={() => {
              setPaymentDebtor(record);
              setPaymentModalOpen(true);
            }}
            icon={<FaDollarSign />}
          />

          <Popover
            trigger="click"
            content={
              <Table
                dataSource={record.payment_log}
                columns={[
                  { title: "Summa", dataIndex: "amount", key: "amount" },
                  {
                    title: "Sana",
                    dataIndex: "date",
                    render: (text) => moment(text).format("YYYY-MM-DD"),
                  },
                ]}
              />
            }
          >
            <Button type="dashed">To‘lovlar</Button>
          </Popover>
        </Space>
      ),
    },
    {
      title:'Sana',
      dataIndex:"createdAt",
      render:(text)=>moment(text).format("DD.MM.YYYY HH:ss")
    }
  ];

  return (
    <>
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={debtors}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        open={paymentModalOpen}
        title={`To‘lov - ${paymentDebtor?.name}`}
        onCancel={() => {
          setPaymentModalOpen(false);
          setPaymentDebtor(null);
          form.resetFields();
        }}
        okText="To‘lash"
        footer={null}
      >
        <Form
          onFinish={async (values) => {
            try {
              values.rate = usdRateData?.rate || 1;
              values.id = paymentDebtor;
              values.amount = Number(values.amount);
              await createPayment(values).unwrap();
              values.payment_method = "qarzdor_tolovi";
              message.success("To‘lov amalga oshirildi");
              setPaymentModalOpen(false);
              form.resetFields();
            } catch (err) {
              message.error("Xatolik: " + err?.data?.message);
            }
          }}
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="To‘lov summasi"
            name="amount"
            rules={[{ required: true, message: "Summani kiriting" }]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item
            label="Valyuta"
            name="currency"
            rules={[{ required: true, message: "Valyutani tanlang" }]}
            initialValue="usd"
          >
            <Select>
              <Select.Option value="usd">USD</Select.Option>
              <Select.Option value="sum">So‘m</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              To‘lash
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        open={modalOpen}
        title={`${selectedDebtor?.name} - mahsulotlar ro'yxati`}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={900}
      >
        {selectedDebtor?.products?.map((product, index) => {
          const productId = product.product_id?._id || product.product_id;
          const key = `${selectedDebtor._id}_${productId}_${index}`;

          const usdRate = Number(usdRateData?.rate || 1);
          const isUsdCurrency =
            product.currency === "usd" || selectedDebtor.currency === "usd";
          const originalPrice = Number(product.sell_price || 0);
          const quantity = Number(product.quantity || 1);
          const convertedPrice = isUsdCurrency
            ? originalPrice * usdRate
            : originalPrice;
          const total = convertedPrice * quantity;

          return (
            <div
              key={index}
              style={{
                marginBottom: "20px",
                borderBottom: "1px solid #ccc",
                paddingBottom: 10,
              }}
            >
              <h4>{product.product_name}</h4>
              <p>
                <b>Soni:</b> {quantity}
              </p>
              <p>
                <b>Narxi:</b> {convertedPrice.toLocaleString("uz-UZ")} so'm
              </p>
              <p>
                <b>Qarz:</b> {total.toLocaleString("uz-UZ")} so'm
              </p>
              <p>
                <b>Sotish vaqti:</b>{" "}
                {moment(product.sold_date || selectedDebtor.sold_date).format(
                  "YYYY-MM-DD"
                )}
              </p>
              <p>
                <b>Qarz vaqti:</b>{" "}
                {moment(product.due_date || selectedDebtor.due_date).format(
                  "YYYY-MM-DD"
                )}
              </p>
              <Input
                placeholder="Qaytariladigan soni"
                value={returnQuantities[key] || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setReturnQuantities((prev) => ({
                    ...prev,
                    [key]: val === "" ? "" : Number(val),
                  }));
                }}
                style={{ width: 150, marginRight: 8 }}
                type="number"
                min={1}
              />
              <Button
                danger
                onClick={() =>
                  handleReturn(selectedDebtor._id, productId, index)
                }
              >
                Qaytarish
              </Button>
            </div>
          );
        })}
      </Modal>
    </>
  );
}
