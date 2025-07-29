import { useState, useEffect, useMemo } from "react";
import {
  Table,
  Card,
  DatePicker,
  Select,
  Statistic,
  Row,
  Col,
  Button,
} from "antd";
import {
  useGetSalesHistoryQuery,
  useDeleteSaleMutation,
} from "../../context/service/sale.service";
// import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { useGetDebtorsQuery } from "../../context/service/debtor.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";
import { Popconfirm, message } from "antd";
const { RangePicker } = DatePicker;
const { Option } = Select;
export default function SotuvTarix() {
  const { data: sales, isLoading } = useGetSalesHistoryQuery();
  // const { data: usdRateData } = useGetUsdRateQuery();
  const { data: debtors = [] } = useGetDebtorsQuery();
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currency, setCurrency] = useState("");
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation();
  const [filteredPayments, setFilteredPayments] = useState([]);
  const { data: usdRate, isLoading: usdLoading } = useGetUsdRateQuery();
  const USD_RATE = usdRate?.rate || 12650;

  const onDateChange = (dates) => {
    setSelectedDateRange(dates);
    filterSales(dates, paymentMethod, currency);
  };

  const onPaymentMethodChange = (value) => {
    setPaymentMethod(value);
    filterSales(selectedDateRange, value, currency);
  };

  const onCurrencyChange = (value) => {
    setCurrency(value);
    filterSales(selectedDateRange, paymentMethod, value);
  };

  const filterSales = (dates, payment, currency) => {
    let filtered = sales || [];
    if (dates && dates[0] && dates[1]) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= dates[0] && saleDate <= dates[1];
      });
    }
    if (payment) {
      filtered = filtered.filter((sale) => sale.payment_method === payment);
    }
    if (currency) {
      filtered = filtered.filter((f) => f.currency === currency);
    }
    setFilteredSales(filtered);

    if (dates && dates[0] && dates[1]) {
      const start = dates[0];
      const end = dates[1];
      const allPayments = [];
      debtors.forEach((debtor) => {
        debtor.payment_log?.forEach((log) => {
          const logDate = new Date(log.date);
          if (logDate >= start && logDate <= end) {
            allPayments.push({
              ...log,
              client_name: debtor.name,
              phone: debtor.phone,
              date: logDate,
            });
          }
        });
      });
      setFilteredPayments(allPayments);
    } else {
      setFilteredPayments([]);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSale(id).unwrap();
    } catch (err) {
      console.error(err);
    }
  };
  const paymentSummary = useMemo(() => {
    const sum = filteredPayments
      .filter((p) => p.currency === "sum")
      .reduce((acc, cur) => acc + cur.amount, 0);
    const usd = filteredPayments
      .filter((p) => p.currency === "usd")
      .reduce((acc, cur) => acc + cur.amount, 0);
    return { sum, usd };
  }, [filteredPayments]);

  const paymentColumns = [
    { title: "Ism", dataIndex: "client_name", key: "client_name" },
    { title: "Telefon", dataIndex: "phone", key: "phone" },
    { title: "Miqdori", dataIndex: "amount", key: "amount" },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
      render: (text) => (text === "usd" ? "$" : "so'm"),
    },
    {
      title: "Sana",
      dataIndex: "date",
      key: "date",
      render: (text) => new Date(text).toLocaleString(),
    },
  ];

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPrice = (price, currency) => {
    const formatted = formatNumber(price);
    return `${formatted} ${currency === "sum" ? "so'm" : "$"}`;
  };

  // Foyda/Zarar hisoblash funksiyasi
  const calculateProfitLoss = (sale) => {
    if (sale.payment_method === "qarzdor_tolovi") return 0;

    if (!sale.sell_price || !sale.buy_price) return 0;

    const quantity = sale.quantity || 1;

    const sellPrice = sale.sell_price * quantity;
    let buyPrice = sale.buy_price * quantity;

    // Mahsulot asl valyutasini aniqlaymiz
    const productCurrency = sale.product_id?.currency || sale.currency;

    // Kursga qarab buy_price ni konvertatsiya qilamiz
    if (productCurrency === "usd" && sale.currency === "sum") {
      buyPrice *= USD_RATE;
    } else if (productCurrency === "sum" && sale.currency === "usd") {
      buyPrice /= USD_RATE;
    }

    return sellPrice - buyPrice;
  };

  const calculateStats = (data, currency) => {
    const filteredByCurrency =
      data?.filter((item) => item.currency === currency) || [];

    const total = filteredByCurrency.reduce(
      (acc, sale) => acc + sale.total_price,
      0
    );

    const totalProfit = filteredByCurrency.reduce((acc, sale) => {
      return acc + calculateProfitLoss(sale);
    }, 0);

    const weekly = filteredByCurrency
      .filter(
        (sale) =>
          new Date(sale.createdAt) >=
          new Date(new Date().setDate(new Date().getDate() - 7))
      )
      .reduce((acc, sale) => acc + sale.total_price, 0);

    const weeklyProfit = filteredByCurrency
      .filter(
        (sale) =>
          new Date(sale.createdAt) >=
          new Date(new Date().setDate(new Date().getDate() - 7))
      )
      .reduce((acc, sale) => acc + calculateProfitLoss(sale), 0);

    const daily = filteredByCurrency
      .filter(
        (sale) =>
          new Date(sale.createdAt).toLocaleDateString() ===
          new Date().toLocaleDateString()
      )
      .reduce((acc, sale) => acc + sale.total_price, 0);

    const dailyProfit = filteredByCurrency
      .filter(
        (sale) =>
          new Date(sale.createdAt).toLocaleDateString() ===
          new Date().toLocaleDateString()
      )
      .reduce((acc, sale) => acc + calculateProfitLoss(sale), 0);

    return {
      total,
      weekly,
      daily,
      totalProfit,
      weeklyProfit,
      dailyProfit,
    };
  };

  const sumStats = calculateStats(filteredSales, "sum");
  const usdStats = calculateStats(filteredSales, "usd");

  useEffect(() => {
    setFilteredSales(sales || []);
  }, [sales]);

  const showDailySales = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    filterSales([startOfDay, endOfDay], paymentMethod, currency);
  };

  const columns = [
    {
      title: "Mahsulot / Qarzdor to'lovi",
      dataIndex: "product_name",
      key: "product_name",
      render: (text, record) => {
        if (record.payment_method === "qarzdor_tolovi") {
          return (
            <span style={{ fontStyle: "italic", color: "#1890ff" }}>
              Qarzdor to'lovi - {record.client_name || "Noma'lum mijoz"}
            </span>
          );
        }
        return text;
      },
    },
    {
      title: "Model",
      dataIndex: ["product_id", "model"],
      key: "model",
      render: (text, record) => record.product_id?.model || "-",
    },
    {
      title: "Valyuta",
      dataIndex: "currency",
      key: "currency",
    },
    {
      title: "Soni",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record) =>
        record.payment_method === "qarzdor_tolovi" ? "-" : text,
    },
    {
      title: "Tan narxi",
      dataIndex: "buy_price",
      key: "buy_price",
      render: (text, record) => {
        if (record.payment_method === "qarzdor_tolovi" || !text) {
          return "-";
        }
        const totalBuyPrice = text * (record.quantity || 1);
        return formatPrice(totalBuyPrice, record.currency);
      },
    },

    {
      title: "Umumiy narxi",
      dataIndex: "total_price",
      key: "total_price",
      render: (text, record) =>
        record.payment_method === "qarzdor_tolovi" ? (
          <span style={{ color: "green", fontWeight: "bold" }}>
            {formatPrice(text, record.currency)}
          </span>
        ) : (
          formatPrice(text, record.currency)
        ),
    },
    {
      title: "Foyda/Zarar",
      key: "profit_loss",
      render: (text, record) => {
        const profitLoss = calculateProfitLoss(record);
        if (profitLoss === 0) {
          return "-";
        }
        const isProfit = profitLoss > 0;
        return (
          <span
            style={{
              color: isProfit ? "#52c41a" : "#ff4d4f",
              fontWeight: "bold",
            }}
          >
            {isProfit ? "+" : ""}
            {formatPrice(Math.abs(profitLoss), record.currency)}
          </span>
        );
      },
    },
    {
      title: "To'lov usuli",
      dataIndex: "payment_method",
      key: "payment_method",
    },
    {
      title: "Sotilgan sana",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Amallar",
      key: "actions",
      render: (text, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>{new Date(record.createdAt).toLocaleDateString()}</span>
          {record.payment_method !== "qarzdor_tolovi" && (
            <Popconfirm
              title="Haqiqatan ham o‘chirmoqchimisiz?"
              onConfirm={() => handleDelete(record._id)}
              okText="Ha"
              cancelText="Yo‘q"
            >
              <Button
                type="link"
                danger
                loading={isDeleting}
                style={{ padding: 0 }}
              >
                O‘chirish
              </Button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card
      title="Sotuvlar tarixi"
      bordered={false}
      style={{ margin: 20, width: "100%" }}
    >
      <div style={{ marginBottom: 20 }}>
        <RangePicker onChange={onDateChange} style={{ marginRight: 20 }} />
        <Select
          placeholder="To'lov usulini tanlang"
          onChange={onPaymentMethodChange}
          style={{ width: 200, marginRight: 20 }}
        >
          <Option value="">Barchasi</Option>
          <Option value="naqd">Naqd</Option>
          <Option value="plastik">Karta</Option>
          <Option value="qarz">Qarz</Option>
          <Option value="qarzdor_tolovi">Qarzdor to'lovi</Option>
        </Select>
        <Select
          placeholder="Valyutani tanlang"
          value={currency}
          onChange={onCurrencyChange}
          style={{ width: 200, marginRight: 20 }}
        >
          <Option value="">Barchasi</Option>
          <Option value="sum">So'm</Option>
          <Option value="usd">USD</Option>
        </Select>
        <Button type="primary" onClick={showDailySales}>
          Bir kunlik savdo
        </Button>
      </div>

      {/* Sotuvlar statistikasi */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy summa (so'm)"
            value={formatPrice(sumStats.total, "sum")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik summa (so'm)"
            value={formatPrice(sumStats.weekly, "sum")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik summa (so'm)"
            value={formatPrice(sumStats.daily, "sum")}
          />
        </Col>
      </Row>

      {/* Foyda/Zarar statistikasi (So'm) */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy foyda/zarar (so'm)"
            value={formatPrice(Math.abs(sumStats.totalProfit), "sum")}
            valueStyle={{
              color: sumStats.totalProfit >= 0 ? "#3f8600" : "#cf1322",
            }}
            prefix={sumStats.totalProfit >= 0 ? "+" : "-"}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik foyda/zarar (so'm)"
            value={formatPrice(Math.abs(sumStats.weeklyProfit), "sum")}
            valueStyle={{
              color: sumStats.weeklyProfit >= 0 ? "#3f8600" : "#cf1322",
            }}
            prefix={sumStats.weeklyProfit >= 0 ? "+" : "-"}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik foyda/zarar (so'm)"
            value={formatPrice(Math.abs(sumStats.dailyProfit), "sum")}
            valueStyle={{
              color: sumStats.dailyProfit >= 0 ? "#3f8600" : "#cf1322",
            }}
            prefix={sumStats.dailyProfit >= 0 ? "+" : "-"}
          />
        </Col>
      </Row>

      {/* USD statistikasi */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy summa ($)"
            value={formatPrice(usdStats.total, "usd")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik summa ($)"
            value={formatPrice(usdStats.weekly, "usd")}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik summa ($)"
            value={formatPrice(usdStats.daily, "usd")}
          />
        </Col>
      </Row>

      {/* USD Foyda/Zarar statistikasi */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Statistic
            title="Umumiy foyda/zarar ($)"
            value={formatPrice(Math.abs(usdStats.totalProfit), "usd")}
            valueStyle={{
              color: usdStats.totalProfit >= 0 ? "#3f8600" : "#cf1322",
            }}
            prefix={usdStats.totalProfit >= 0 ? "+" : "-"}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Haftalik foyda/zarar ($)"
            value={formatPrice(Math.abs(usdStats.weeklyProfit), "usd")}
            valueStyle={{
              color: usdStats.weeklyProfit >= 0 ? "#3f8600" : "#cf1322",
            }}
            prefix={usdStats.weeklyProfit >= 0 ? "+" : "-"}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="Kunlik foyda/zarar ($)"
            value={formatPrice(Math.abs(usdStats.dailyProfit), "usd")}
            valueStyle={{
              color: usdStats.dailyProfit >= 0 ? "#3f8600" : "#cf1322",
            }}
            prefix={usdStats.dailyProfit >= 0 ? "+" : "-"}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Statistic
            title="Qarzdor to'lovlari (so'm)"
            value={formatPrice(paymentSummary.sum, "sum")}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Qarzdor to'lovlari ($)"
            value={formatPrice(paymentSummary.usd, "usd")}
          />
        </Col>
      </Row>

      <Table
        dataSource={filteredSales}
        loading={isLoading}
        style={{ width: "100%" }}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />

      <Table
        title={() => "Qarzdor to'lovlari ro'yxati"}
        dataSource={filteredPayments}
        columns={paymentColumns}
        rowKey={(record, index) => index}
        pagination={{ pageSize: 5 }}
      />
    </Card>
  );
}
