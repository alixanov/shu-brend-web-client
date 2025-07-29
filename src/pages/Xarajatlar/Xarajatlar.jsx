import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Card,
  Row,
  Col,
  message,
  DatePicker,
} from "antd";
import dayjs from "dayjs";
import {
  useGetExpensesQuery,
  useAddExpenseMutation,
} from "../../context/service/harajatlar.service";
import {
  useGetBudgetQuery,
  useUpdateBudgetMutation,
} from "../../context/service/budget.service";

export default function Xarajatlar() {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const { data: budgetData } = useGetBudgetQuery();
  const [updateBudget] = useUpdateBudgetMutation();
  const { data: expensesData, isLoading } = useGetExpensesQuery();
  const [addExpense, { isLoading: isAddLoading }] = useAddExpenseMutation();

  useEffect(() => {
    if (expensesData) {
      setExpenses(expensesData);
    }
  }, [expensesData]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    try {
      const response = await addExpense(values).unwrap();
      await updateBudget(Number(values.payment_summ)).unwrap();
      setExpenses([...expenses, response.expense]);
      form.resetFields();
      message.success(response.message);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Xatolik:", error);
      message.error("Xarajatni qo'shishda xatolik yuz berdi.");
    }
  };

  // Sana bo‘yicha filterlangan xarajatlar
  const filteredExpenses =
    dateRange.length === 2
      ? expenses.filter((item) => {
          const created = dayjs(item.createdAt);
          return (
            created.isAfter(dayjs(dateRange[0]).startOf("day")) &&
            created.isBefore(dayjs(dateRange[1]).endOf("day"))
          );
        })
      : expenses;

  // Guruhlash: staff_name bo‘yicha
  const groupedExpenses = filteredExpenses.reduce((acc, item) => {
    if (!acc[item.staff_name]) acc[item.staff_name] = [];
    acc[item.staff_name].push(item);
    return acc;
  }, {});

  return (
    <div>
      <Button
        type="primary"
        onClick={showModal}
        style={{ marginBottom: "10px" }}
      >
        Xarajat Qo'shish
      </Button>

      {/* Kalendar Range */}
      <DatePicker.RangePicker
        style={{ marginBottom: 16 }}
        onChange={(dates) => setDateRange(dates || [])}
        format="YYYY-MM-DD"
      />

      {/* Modal */}
      <Modal
        title="Xarajat Qo'shish"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item
            label="Xarajat summasi"
            name="payment_summ"
            rules={[{ required: true, message: "Xarajat summasini kiriting!" }]}
          >
            <Input type="number" placeholder="Xarajat summasi" />
          </Form.Item>
          <Form.Item
            label="Xarajat sababi"
            name="comment"
            rules={[{ required: true, message: "Xarajat sababini kiriting!" }]}
          >
            <Input.TextArea placeholder="Xarajat sababi" />
          </Form.Item>
          <Form.Item
            label="Xodim ismi"
            name="staff_name"
            rules={[{ required: true, message: "Xodim ismini kiriting!" }]}
          >
            <Input placeholder="Xodim ismi" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isAddLoading}
            >
              Qo'shish
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Xarajatlar ro'yxati */}
      <Row gutter={[16, 16]}>
        {Object.entries(groupedExpenses).map(([staffName, staffExpenses]) => {
          const totalSum = staffExpenses.reduce(
            (acc, curr) => acc + Number(curr.payment_summ),
            0
          );
          return (
            <Col xs={24} md={12} lg={8} key={staffName}>
              <Card title={staffName} bordered>
                <p>
                  <strong>Umumiy xarajat:</strong> {totalSum.toLocaleString()}{" "}
                  so'm
                </p>
                <div>
                  {staffExpenses.map((item, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <strong>{item.payment_summ.toLocaleString()} so'm</strong>{" "}
                      — {item.comment}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
