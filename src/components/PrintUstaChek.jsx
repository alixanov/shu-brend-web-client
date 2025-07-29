import React, { forwardRef } from "react";
import moment from "moment";
import logo from "../assets/logo.png";

const PrintUstaChek = forwardRef(
  ({ masterName, car, usdRate, amount }, ref) => {
    if (!car) return null;
    console.log(amount);

    const totalSales = car.sales?.reduce((sum, sale) => {
      const conv =
        sale.currency === "usd" ? sale.total_price * usdRate : sale.total_price;
      return sum + conv;
    }, 0);

    const totalPaid =
      car.payment_log?.reduce((sum, p) => {
        const conv = p.currency === "usd" ? p.amount * usdRate : p.amount;
        return sum + conv;
      }, 0) + amount;

    const remaining = totalSales - totalPaid;

    return (
      <div ref={ref} style={{ width: "80mm", padding: 10 }}>
        <div style={{ textAlign: "center" }}>
          <img src={logo} alt="Logo" width="100" />
          <h3>{masterName}</h3>
          <p>
            Mashina: <b>{car.car_name}</b>
          </p>
          <p>Sana: {moment().format("DD.MM.YYYY HH:mm")}</p>
        </div>

        <table style={{ width: "100%", fontSize: "12px" }}>
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Soni</th>
              <th>Narx</th>
              <th>Jami</th>
            </tr>
          </thead>
          <tbody>
            {car.sales?.map((item, i) => (
              <tr key={i}>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>
                  {item.sell_price} {item.currency.toUpperCase()}
                </td>
                <td>
                  {item.total_price.toFixed(2)} {item.currency.toUpperCase()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />
        <p>
          <b>Jami sotuv (so'mda):</b> {totalSales.toLocaleString()}
        </p>
        <p>
          <b>To‘langan:</b> {totalPaid.toLocaleString()}
        </p>
        <p>
          <b>Qolgan:</b>{" "}
          {remaining <= 0 ? "To‘liq to‘langan" : remaining.toLocaleString()}
        </p>

        <hr />
        <p style={{ textAlign: "center", fontSize: "10px" }}>
          +998 91 294 87 80 | +998 90 790 42 32
        </p>
      </div>
    );
  }
);

export default PrintUstaChek;
