import React, { useRef, useState } from "react";
import {
  Button,
  Modal,
  Table,
  Popover,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import { FaEye } from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import {
  useCreatePaymentToMasterMutation,
  useDeleteMasterMutation,
  useDeleteCarFromMasterMutation,
  useGetMastersQuery,
} from "../../context/service/master.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { MdDelete } from "react-icons/md";
import moment from "moment";
import PrintUstaChek from "../PrintUstaChek";

const { Option } = Select;

const MastersModal = ({ visible, onClose }) => {
  const { data: masters = [], refetch } = useGetMastersQuery();
  const [openSalesPopover, setOpenSalesPopover] = useState(null);
  const [openPaymentPopover, setOpenPaymentPopover] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState({ currency: "sum" });
  const [createPayment] = useCreatePaymentToMasterMutation();
  const [deleteMaster] = useDeleteMasterMutation();
  const [deleteCarFromMaster] = useDeleteCarFromMasterMutation(); // ✅ YANGI
  const { data: rate = {} } = useGetUsdRateQuery();
  const receiptRef = useRef();
  const [receiptData, setReceiptData] = useState(null);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: "Usta uchun tolov cheki",
    onAfterPrint: () => {
      setReceiptData(null); // modalni yopish
    },
  });

  const usdRate = rate.rate;

  const handlePayment = async (masterId, carId) => {
    const { amount, currency, payment_method } = selectedPayment;
    if (!amount || !currency) return message.warning("To'liq to'ldiring");
    try {
      await createPayment({
        master_id: masterId,
        car_id: carId,
        payment: { amount, currency, payment_method },
      });
      await refetch();
      message.success("To'lov qo'shildi");
      setOpenPaymentPopover(null);
      // setSelectedPayment({});
    } catch (err) {
      message.error("Xatolik yuz berdi");
    }
  };

  const handleDeleteCar = async (master_id, car_id) => {
    try {
      await deleteCarFromMaster({ master_id, car_id });
      message.success("Mashina o‘chirildi");
    } catch (err) {
      message.error("Mashina o‘chirishda xatolik");
    }
  };

  const carColumns = (cars = []) => [
    {
      title: "Sana",
      dataIndex: "date",
      render: (text) => moment(text).format("DD.MM.YYYY HH:mm"),
    },
    {
      title: "Mashina nomi",
      dataIndex: "car_name",
    },
    {
      title: "Amallar",
      render: (_, car) => (
        <Popover
          content={
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: "Mahsulot", dataIndex: "product_name" },
                { title: "Miqdor", dataIndex: "quantity" },
                {
                  title: "Narx",
                  dataIndex: "sell_price",
                  render: (text) => text.toFixed(2),
                },
                {
                  title: "Valyuta",
                  dataIndex: "currency",
                  render: (text) => text.toUpperCase(),
                },
                {
                  title: "Jami",
                  dataIndex: "total_price",
                  render: (text) => text.toFixed(2),
                },
              ]}
              dataSource={car.sales}
              rowKey={(item) => item.product_id}
            />
          }
          trigger="click"
          open={openSalesPopover === car._id}
          onOpenChange={(open) => setOpenSalesPopover(open ? car._id : null)}
        >
          <Button icon={<FaEye />} size="small" />
        </Popover>
      ),
    },
    {
      title: "Umumiy sotuv (so'mda)",
      render: (_, car) => {
        const total = car.sales?.reduce((sum, sale) => {
          const converted =
            sale.currency === "usd"
              ? sale.total_price * usdRate
              : sale.total_price;
          return sum + converted;
        }, 0);
        return total.toLocaleString();
      },
    },
    {
      title: "To'langan (so'mda)",
      render: (_, car) => {
        const total = car.payment_log?.reduce((sum, p) => {
          const converted =
            p.currency === "usd" ? p.amount * usdRate : p.amount;
          return sum + converted;
        }, 0);
        return total.toLocaleString();
      },
    },
    {
      title: "Qolgan (so'mda)",
      render: (_, car) => {
        const totalSales = car.sales?.reduce((sum, sale) => {
          const converted =
            sale.currency === "usd"
              ? sale.total_price * usdRate
              : sale.total_price;
          return sum + converted;
        }, 0);
        const totalPayments = car.payment_log?.reduce((sum, p) => {
          const converted =
            p.currency === "usd" ? p.amount * usdRate : p.amount;
          return sum + converted;
        }, 0);
        const remaining = totalSales - totalPayments;
        return remaining <= 0 ? "To‘liq to‘langan" : remaining.toLocaleString();
      },
    },
    {
      title: "To'lov tarixi",
      render: (_, car) => (
        <Popover
          content={
            <Table
              size="small"
              pagination={false}
              columns={[
                { title: "Miqdor", dataIndex: "amount" },
                {
                  title: "Valyuta",
                  dataIndex: "currency",
                  render: (c) => c.toUpperCase(),
                },
                {
                  title: "To'lov usuli",
                  dataIndex: "payment_method",
                  render: (text) => (text === "cash" ? "Naqd" : "Karta"),
                },
                {
                  title: "Sana",
                  dataIndex: "date",
                  render: (d) => new Date(d).toLocaleDateString(),
                },
              ]}
              dataSource={car.payment_log}
              rowKey={(row, i) => i}
            />
          }
          trigger="click"
        >
          <Button size="small" icon={<FaEye />} />
        </Popover>
      ),
    },
    {
      title: "To'lov",
      render: (_, car) => {
        // 1) Qolgan summani hisoblaymiz
        const totalSales = car.sales?.reduce((sum, sale) => {
          const converted =
            sale.currency === "usd"
              ? sale.total_price * usdRate
              : sale.total_price;
          return sum + converted;
        }, 0);
        const totalPayments = car.payment_log?.reduce((sum, p) => {
          const converted =
            p.currency === "usd" ? p.amount * usdRate : p.amount;
          return sum + converted;
        }, 0);
        const remaining = totalSales - totalPayments;

        return (
          <Popover
            trigger="click"
            open={openPaymentPopover === car._id}
            onOpenChange={(open) => {
              if (open) {
                // 2) Popover ochilganda avtomatik setSelectedPayment qilamiz
                setOpenPaymentPopover(car._id);
                setSelectedPayment({
                  carId: car._id,
                  amount: remaining > 0 ? remaining : 0,
                  currency: "sum",
                  payment_method: "cash",
                });
              } else {
                setOpenPaymentPopover(null);
              }
            }}
            content={
              <div style={{ width: 200 }}>
                <Input
                  placeholder="Miqdori"
                  type="number"
                  value={
                    selectedPayment?.carId === car._id
                      ? selectedPayment.amount
                      : ""
                  }
                  onChange={(e) =>
                    setSelectedPayment({
                      ...selectedPayment,
                      amount: Number(e.target.value),
                    })
                  }
                />

                <Select
                  value={
                    selectedPayment?.carId === car._id
                      ? selectedPayment.currency
                      : "sum"
                  }
                  disabled
                  style={{ width: "100%", marginTop: 8 }}
                >
                  <Option value="sum">So'm</Option>
                  <Option value="usd">USD</Option>
                </Select>

                <Select
                  value={
                    selectedPayment?.carId === car._id
                      ? selectedPayment.payment_method
                      : ""
                  }
                  placeholder="To‘lov usuli"
                  onChange={(value) =>
                    setSelectedPayment({
                      ...selectedPayment,
                      payment_method: value,
                    })
                  }
                  style={{ width: "100%", marginTop: 8 }}
                >
                  <Option value="cash">Naqd</Option>
                  <Option value="card">Karta</Option>
                </Select>

                <Button
                  type="primary"
                  style={{ marginTop: 10, width: "100%" }}
                  onClick={async () => {
                    try {
                      await handlePayment(car.master_id, car._id);
                      await refetch();
                      const updatedMaster = masters.find(
                        (m) => m._id === car.master_id
                      );
                      const updatedCar = updatedMaster?.cars?.find(
                        (c) => c._id === car._id
                      );

                      if (!updatedCar) {
                        return message.error("Mashina ma’lumoti yangilanmadi");
                      }
                      setReceiptData({
                        masterName: masters.find((m) => m._id === car.master_id)
                          ?.master_name,
                        car,
                        amount: selectedPayment.amount,
                      });
                    } catch (err) {
                      console.log(err);
                    }
                  }}
                >
                  To'lovni yuborish
                </Button>
              </div>
            }
          >
            <Button size="small">To‘lov</Button>
          </Popover>
        );
      },
    },

    {
      title: "O‘chirish",
      render: (_, car) => (
        <Popconfirm
          title="Chindan ham mashinani o‘chirmoqchimisiz?"
          okText="Ha"
          cancelText="Yo‘q"
          onConfirm={() => handleDeleteCar(car.master_id, car._id)}
        >
          <Button danger icon={<MdDelete />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const masterColumns = [
    {
      title: "Ismi",
      dataIndex: "master_name",
    },
    {
      title: "Umumiy sotuv (so'mda)",
      dataIndex: "cars",
      render: (cars) => {
        const totalSum = cars.reduce((acc, car) => {
          const carSales = car.sales || [];
          const carTotal = carSales.reduce((sum, sale) => {
            const price = sale.total_price;
            const converted = sale.currency === "usd" ? price * usdRate : price;
            return sum + converted;
          }, 0);
          return acc + carTotal;
        }, 0);
        return totalSum.toLocaleString();
      },
    },
    {
      title: "O'chirish",
      render: (_, record) => (
        <Popconfirm
          title="Chindan ham ustani o'chirmoqchimisiz?"
          okText="Ha"
          cancelText="Yo'q"
          onConfirm={() => {
            deleteMaster({ master_id: record._id });
          }}
        >
          <Button danger icon={<MdDelete />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Modal
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        title="Ustalar ro'yxati"
      >
        <Table
          dataSource={masters}
          columns={masterColumns}
          rowKey={(record) => record._id}
          pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={carColumns(record.cars)}
                dataSource={record.cars.map((car) => ({
                  ...car,
                  master_id: record._id,
                }))}
                rowKey="_id"
                pagination={false}
                size="small"
              />
            ),
          }}
        />
      </Modal>
      <Modal
        open={!!receiptData}
        onCancel={() => setReceiptData(null)}
        footer={[
          <Button type="primary" onClick={handlePrint}>
            Chop etish
          </Button>,
        ]}
        title="Usta uchun to‘lov cheki"
      >
        <PrintUstaChek
          ref={receiptRef}
          masterName={receiptData?.masterName}
          car={receiptData?.car}
          usdRate={usdRate}
          amount={selectedPayment.amount || 0}
        />
      </Modal>
    </>
  );
};

export default MastersModal;
