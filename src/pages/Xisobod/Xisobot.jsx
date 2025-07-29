import React, { useEffect, useState, useMemo } from "react";
import {
  DatePicker,
  Spin,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Statistic,
  Button,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  ExclamationCircleOutlined,
  FundOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// API servislari import qilish
import { useGetBudgetQuery } from "../../context/service/budget.service";
import { useGetAllProductsQuery } from "../../context/service/addproduct.service";
import { useGetDebtorsQuery } from "../../context/service/debtor.service";
import { useGetStoreProductsQuery } from "../../context/service/store.service";
import { useGetExpensesQuery } from "../../context/service/harajatlar.service";
import { useGetSalesHistoryQuery } from "../../context/service/sale.service";
import { useGetUsdRateQuery } from "../../context/service/usd.service";

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function Xisobot() {
  // Haqiqiy API hooks
  const { data: budgetData, isLoading: budgetLoading } = useGetBudgetQuery();
  const { data: saleData, isLoading: saleLoading } = useGetSalesHistoryQuery();
  const { data: skladData, isLoading: skladLoading } = useGetAllProductsQuery();
  const { data: storeData, isLoading: storeLoading } =
    useGetStoreProductsQuery();
  const { data: debtData, isLoading: debtLoading } = useGetDebtorsQuery();
  const { data: harajatData, isLoading: harajatLoading } =
    useGetExpensesQuery();
  const { data: usdRate, isLoading: usdLoading } = useGetUsdRateQuery();

  const [selectedRange, setSelectedRange] = useState([]);

  const currentRate = usdRate?.rate || 12500;

  // Barcha loading holatlarini birlashtiramiz
  const isLoading =
    budgetLoading ||
    saleLoading ||
    skladLoading ||
    storeLoading ||
    debtLoading ||
    harajatLoading ||
    usdLoading;

  const handleDateChange = (dates) => {
    setSelectedRange(dates || []);
  };

  // Bir kunlik hisobot tugmasi uchun funksiya
  const handleDailyReport = () => {
    const today = dayjs();
    setSelectedRange([today, today]);
  };

  // Optimallashtirilgan hisoblashlar useMemo bilan
  const calculations = useMemo(() => {
    if (isLoading || !debtData || !saleData) {
      return {
        umumiyDebt: 0,
        umumiyDebtUzs: 0,
        umumiySaleSum: 0,
        umumiySaleUsd: 0,
        umumiyFoydaSum: 0,
        umumiyFoydaUsd: 0,
        umumiySklad: 0,
        umumiyStore: 0,
        umumiyHarajat: 0,
        umumiyAstatka: 0,
        umumiyAstatkaUzs: 0,
      };
    }

    const startDate = selectedRange[0]
      ? new Date(selectedRange[0].startOf("day"))
      : null;
    const endDate = selectedRange[1]
      ? new Date(selectedRange[1].endOf("day"))
      : null;

    // Sana filtri funksiyasi
    const isInDateRange = (itemDate) => {
      const date = new Date(itemDate);
      return (!startDate || date >= startDate) && (!endDate || date <= endDate);
    };

    // Valyuta tekshirish funksiyasi
    const isUsdCurrency = (currency) => {
      const normalizedCurrency = (currency || "sum").toLowerCase();
      return ["usd", "dollar", "us dollar"].includes(normalizedCurrency);
    };

    // Qarzdorlikni hisoblash
    const filteredUsdDebt = debtData.filter(
      (item) => isInDateRange(item.createdAt) && isUsdCurrency(item.currency)
    );
    const filteredUzsDebt = debtData.filter(
      (item) => isInDateRange(item.createdAt) && !isUsdCurrency(item.currency)
    );

    const usdDebt = filteredUsdDebt.reduce(
      (sum, item) => sum + (item.debt_amount || 0),
      0
    );
    const uzsDebt = filteredUzsDebt.reduce(
      (sum, item) => sum + (item.debt_amount || 0),
      0
    );

    // Sotuv summasini hisoblash
    const filteredSalesSum =
      saleData?.filter(
        (item) => isInDateRange(item.createdAt) && !isUsdCurrency(item.currency)
      ) || [];
    const filteredSalesUsd =
      saleData?.filter(
        (item) => isInDateRange(item.createdAt) && isUsdCurrency(item.currency)
      ) || [];

    const totalSaleSum = filteredSalesSum.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0
    );
    const totalSaleUsd = filteredSalesUsd.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0
    );

    // Foyda hisoblash (So'm)
    const totalProfitSum = filteredSalesSum.reduce((sum, item) => {
      const sellPrice = item.sell_price || 0;
      const buyPrice = item.buy_price || 0;
      const quantity = item.quantity || 0;
      const purchaseCurrency = item.product_id?.purchase_currency || "sum";
      const saleUsdRate = item.usd_rate || currentRate;

      const convertedBuyPrice = isUsdCurrency(purchaseCurrency)
        ? buyPrice * saleUsdRate
        : buyPrice;
      const profit = (sellPrice - convertedBuyPrice) * quantity;
      return sum + Math.max(0, profit);
    }, 0);

    // Foyda hisoblash (USD)
    const totalProfitUsd = filteredSalesUsd.reduce((sum, item) => {
      const sellPrice = item.sell_price || 0;
      const buyPrice = item.buy_price || 0;
      const quantity = item.quantity || 0;
      const purchaseCurrency = item.product_id?.purchase_currency || "usd";
      const saleUsdRate = item.usd_rate || currentRate;

      const convertedBuyPrice = !isUsdCurrency(purchaseCurrency)
        ? buyPrice / saleUsdRate
        : buyPrice;
      const profit = (sellPrice - convertedBuyPrice) * quantity;
      return sum + Math.max(0, profit);
    }, 0);

    // Sklad foyda
    const skladProfit =
      skladData?.reduce((sum, item) => {
        const stock = item.stock || 0;
        const sellPrice = item.sell_price || 0;
        const purchasePrice = item.purchase_price || 0;
        const multiplier = isUsdCurrency(item.sell_currency) ? currentRate : 1;
        return sum + stock * (sellPrice - purchasePrice) * multiplier;
      }, 0) || 0;

    // Do'kon foyda
    const storeProfit =
      storeData?.reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const sellPrice = item.product_id?.sell_price || 0;
        const purchasePrice = item.product_id?.purchase_price || 0;
        const multiplier = isUsdCurrency(item.product_id?.sell_currency)
          ? currentRate
          : 1;
        return sum + quantity * (sellPrice - purchasePrice) * multiplier;
      }, 0) || 0;

    // Harajat
    const totalExpenses =
      harajatData
        ?.filter((item) => isInDateRange(item.created_at))
        .reduce((sum, item) => sum + (item.payment_summ || 0), 0) || 0;

    // Astatka hisoblash
    const astatkaUsd =
      (skladData
        ?.filter((item) => isUsdCurrency(item.sell_currency))
        .reduce(
          (sum, item) => sum + (item.stock || 0) * (item.purchase_price || 0),
          0
        ) || 0) +
      (storeData
        ?.filter((item) => isUsdCurrency(item.product_id?.sell_currency))
        .reduce(
          (sum, item) =>
            sum + (item.quantity || 0) * (item.product_id?.purchase_price || 0),
          0
        ) || 0);

    const astatkaUzs =
      (skladData
        ?.filter((item) => !isUsdCurrency(item.sell_currency))
        .reduce(
          (sum, item) => sum + (item.stock || 0) * (item.purchase_price || 0),
          0
        ) || 0) +
      (storeData
        ?.filter((item) => !isUsdCurrency(item.product_id?.sell_currency))
        .reduce(
          (sum, item) =>
            sum + (item.quantity || 0) * (item.product_id?.purchase_price || 0),
          0
        ) || 0);

    return {
      umumiyDebt: usdDebt,
      umumiyDebtUzs: uzsDebt,
      umumiySaleSum: totalSaleSum,
      umumiySaleUsd: totalSaleUsd,
      umumiyFoydaSum: Math.max(0, totalProfitSum - totalExpenses),
      umumiyFoydaUsd: Math.max(0, totalProfitUsd),
      umumiySklad: skladProfit,
      umumiyStore: storeProfit,
      umumiyHarajat: totalExpenses,
      umumiyAstatka: astatkaUsd,
      umumiyAstatkaUzs: astatkaUzs,
    };
  }, [
    debtData,
    saleData,
    skladData,
    storeData,
    harajatData,
    selectedRange,
    currentRate,
    isLoading,
  ]);

  // Raqam formatlash
  const formatNumber = (num) => {
    return new Intl.NumberFormat("uz-UZ", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(num));
  };

  const StatCard = ({ title, value, currency, icon, color = "#1890ff" }) => (
    <Card
      hoverable
      style={{
        height: "100%",
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        borderRadius: "12px",
        transition: "all 0.3s ease",
      }}
      bodyStyle={{ padding: "20px" }}
    >
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Space>
          {icon}
          <Typography.Text
            style={{ color: "#666", fontSize: "14px", fontWeight: 500 }}
          >
            {title}
          </Typography.Text>
        </Space>
        <Statistic
          value={formatNumber(value)}
          suffix={currency}
          valueStyle={{
            color: color,
            fontSize: "20px",
            fontWeight: "bold",
            fontFamily: "monospace",
          }}
        />
      </Space>
    </Card>
  );

  if (isLoading) {
    return (
      <div
        style={{
          height: "calc(100vh - 200px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" tip="Ma'lumotlar yuklanmoqda..." />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 200px)",
        padding: "20px",
        background: "#f5f7fa",
      }}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Header */}
        <Card style={{ borderRadius: "12px" }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              📊 Moliyaviy Hisobot
            </Title>
            <Space size="middle" wrap>
              <RangePicker
                value={selectedRange}
                onChange={handleDateChange}
                format="DD/MM/YYYY"
                placeholder={["Boshlanish sanasi", "Tugash sanasi"]}
                style={{ width: "100%", maxWidth: "400px" }}
                size="large"
              />
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={handleDailyReport}
                size="large"
                style={{
                  background: "#52c41a",
                  borderColor: "#52c41a",
                  borderRadius: "8px",
                  fontWeight: "500",
                }}
              >
                Bir kunlik hisobot
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Sotuv (So'm)"
              value={calculations.umumiySaleSum}
              currency="UZS"
              icon={
                <ShoppingCartOutlined
                  style={{ color: "#52c41a", fontSize: "18px" }}
                />
              }
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Sotuv (USD)"
              value={calculations.umumiySaleUsd}
              currency="$"
              icon={
                <DollarOutlined
                  style={{ color: "#1890ff", fontSize: "18px" }}
                />
              }
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Foyda (So'm)"
              value={calculations.umumiyFoydaSum}
              currency="UZS"
              icon={
                <TrophyOutlined
                  style={{ color: "#faad14", fontSize: "18px" }}
                />
              }
              color="#faad14"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Foyda (USD)"
              value={calculations.umumiyFoydaUsd}
              currency="$"
              icon={
                <TrophyOutlined
                  style={{ color: "#fa8c16", fontSize: "18px" }}
                />
              }
              color="#fa8c16"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Qarzdorlik (So'm)"
              value={calculations.umumiyDebtUzs}
              currency="UZS"
              icon={
                <ExclamationCircleOutlined
                  style={{ color: "#ff4d4f", fontSize: "18px" }}
                />
              }
              color="#ff4d4f"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Qarzdorlik (USD)"
              value={calculations.umumiyDebt}
              currency="$"
              icon={
                <ExclamationCircleOutlined
                  style={{ color: "#ff7875", fontSize: "18px" }}
                />
              }
              color="#ff7875"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Harajatlar"
              value={calculations.umumiyHarajat}
              currency="UZS"
              icon={
                <FundOutlined style={{ color: "#722ed1", fontSize: "18px" }} />
              }
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={6}>
            <StatCard
              title="Astatka (So'm)"
              value={calculations.umumiyAstatkaUzs}
              currency="UZS"
              icon={
                <HomeOutlined style={{ color: "#13c2c2", fontSize: "18px" }} />
              }
              color="#13c2c2"
            />
          </Col>
        </Row>

        {/* Qo'shimcha ma'lumotlar */}
        <Card
          title="📈 Qo'shimcha Ko'rsatkichlar"
          style={{ borderRadius: "12px" }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <StatCard
                title="Astatka (USD)"
                value={calculations.umumiyAstatka}
                currency="$"
                icon={
                  <HomeOutlined
                    style={{ color: "#096dd9", fontSize: "18px" }}
                  />
                }
                color="#096dd9"
              />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="USD Kursi"
                value={currentRate}
                currency="UZS"
                icon={
                  <DollarOutlined
                    style={{ color: "#389e0d", fontSize: "18px" }}
                  />
                }
                color="#389e0d"
              />
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}
