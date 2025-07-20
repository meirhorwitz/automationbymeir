const spinner = document.querySelector(
  "#paypal-button-container .loading-spinner"
);

window.paypal
  .Buttons({
    style: {
      shape: "rect",
      layout: "vertical",
      color: "gold",
      label: "paypal",
    },

    async createOrder(data, actions) {
      const amountValue = document.getElementById("amount").value;
      if (!amountValue || parseFloat(amountValue) <= 0) {
        resultMessage("Please enter a valid payment amount.");
        return;
      }

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: amountValue }),
        });

        if (response.ok) {
          const orderData = await response.json();
          if (orderData.id) {
            return orderData.id;
          }
        }

        throw new Error("Server order failed");
      } catch (error) {
        console.warn("Falling back to client-side order creation", error);
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: amountValue,
              },
            },
          ],
        });
      }
    },

    async onApprove(data, actions) {
      try {
        const response = await fetch(`/api/orders/${data.orderID}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const orderData = await response.json();
          const transaction =
            orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
            orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];
          if (transaction) {
            resultMessage(
              `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`
            );
            console.log(
              "Capture result",
              orderData,
              JSON.stringify(orderData, null, 2)
            );
            return;
          }
        }
        throw new Error("Server capture failed");
      } catch (error) {
        console.warn("Falling back to client-side capture", error);
        return actions.order
          .capture()
          .then((details) => {
            resultMessage(
              `Transaction ${details.status}: ${details.id}<br><br>See console for all available details`
            );
            console.log("Capture result", details);
          })
          .catch((err) => {
            console.error(err);
            resultMessage(
              `Sorry, your transaction could not be processed...<br><br>${err}`
            );
          });
      }
    },
  })
  .render("#paypal-button-container")
  .then(() => {
    if (spinner) spinner.remove();
  });

function resultMessage(message) {
  const container = document.querySelector("#result-message");
  container.innerHTML = message;
}
