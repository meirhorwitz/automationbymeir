/**
 * Renders the PayPal Buttons and handles the entire payment flow.
 */
window.paypal
  .Buttons({
    style: {
      shape: "rect",
      layout: "vertical",
      color: "gold",
      label: "paypal",
    },

    /**
     * Creates an order. This function is called when the user clicks the PayPal button.
     * It first attempts to create an order on the server. If that fails, it falls
     * back to creating the order on the client side.
     * @param {object} data - Data passed from the PayPal button.
     * @param {object} actions - Actions available to the button.
     * @returns {string|Promise<string>} The order ID.
     */
    async createOrder(data, actions) {
      const amountValue = document.getElementById("amount").value;
      if (!amountValue || parseFloat(amountValue) <= 0) {
        resultMessage("Please enter a valid payment amount.");
        // Use Promise.reject() to stop the flow without an error in the console
        return Promise.reject(new Error("Invalid amount"));
      }

      try {
        // Attempt to create the order on the server
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountValue
          }),
        });

        const orderData = await response.json();

        if (response.ok && orderData.id) {
          return orderData.id;
        }

        // Handle server-side errors
        const errorDetail = orderData?.details?.[0];
        const errorMessage = errorDetail ?
          `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})` :
          JSON.stringify(orderData);

        throw new Error(errorMessage);

      } catch (error) {
        console.warn("Server-side order creation failed. Falling back to client-side.", error);
        // Fallback to client-side order creation if the server call fails
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: "USD",
              value: amountValue,
            },
          }, ],
        });
      }
    },

    /**
     * Captures the funds from the transaction. This function is called after the
     * user approves the payment. It attempts to capture the order on the server.
     * If that fails, it falls back to a client-side capture.
     * @param {object} data - Data passed from the PayPal button.
     * @param {object} actions - Actions available to the button.
     */
    async onApprove(data, actions) {
      try {
        // Attempt to capture the order on the server
        const response = await fetch(`/api/orders/${data.orderID}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const orderData = await response.json();
        const errorDetail = orderData?.details?.[0];

        // Handle specific server-side errors
        if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
          // Instructs the buyer to use a different funding instrument
          return actions.restart();
        } else if (errorDetail) {
          // Handle other server-side errors
          throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
        }

        // On success, show a success message to the buyer
        const transaction =
          orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];

        resultMessage(
          `Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`
        );
        console.log(
          "Capture result",
          orderData,
          JSON.stringify(orderData, null, 2)
        );

      } catch (error) {
        console.error("Server-side capture failed. Falling back to client-side.", error);
        // Fallback to client-side capture if the server call fails
        // This is not a common practice for production apps but provides a fallback
        return actions.order
          .capture()
          .then((details) => {
            resultMessage(
              `Transaction ${details.status}: ${details.id}<br><br>See console for all available details`
            );
            console.log("Client-side capture result", details);
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
  .render("#paypal-button-container");

/**
 * Helper function to display a message to the user.
 * @param {string} message - The message to display.
 */
function resultMessage(message) {
  const container = document.querySelector("#result-message");
  container.innerHTML = message;
}
