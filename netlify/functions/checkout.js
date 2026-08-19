/ Esta función se ejecuta en el servidor de Netlify (no en el navegador),
// así tu clave secreta de Stripe nunca queda expuesta.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  try {
    const { items } = JSON.parse(event.body);
    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Carrito vacío" }) };
    }

    const line_items = items.map((i) => ({
      price_data: {
        currency: "hnl", // cambia a "usd" u otra moneda si lo necesitas
        product_data: { name: i.name },
        unit_amount: Math.round(i.price * 100), // Stripe usa centavos
      },
      quantity: i.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${process.env.URL}/exito.html`,
      cancel_url: `${process.env.URL}/`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
