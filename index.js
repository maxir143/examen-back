import express from "express";
import {
  DBConnection,
  createCard,
  deactivateCard,
  getCard,
  redeemCredit,
  setEmail,
} from "./db.js";

const client = await DBConnection();
const app = express();
app.use(express.json());

// Flujo de compra de tarjeta
app.post("/card/create", async function (req, res) {
  const {
    active = true,
    singleUse = false,
    credit = 0,
    expirationDate = "",
    email = "",
  } = req.body;

  try {
    if (typeof singleUse != "boolean") throw new Error("type error singleUse");
    if (typeof credit != "number") throw new Error("type error credit");
    if (typeof active != "boolean") throw new Error("type error active");
    if (typeof expirationDate != "string")
      throw new Error("type error expirationDate");
    if (typeof email != "string") throw new Error("type error email");

    // TODO: validate email and date

    if (credit <= 0) {
      return res.status(400).send("credit cant be less than 1");
    }

    const card = await createCard(client, {
      singleUse,
      expirationDate,
      email,
      active,
      credit,
    });

    res.status(200).json({ id: card?.insertedId });
  } catch (e) {
    res.status(500).send(e?.message);
  }
});

// Flujo de canje de tarjeta
app.post("/card/redeem", async function (req, res) {
  const { cardId, transactionValue } = req.body;

  if (!cardId || !transactionValue)
    return res.status(400).send("missing cardId or transactionValue");

  try {
    const card = await getCard(client, cardId);

    if (!card) return res.status(404).send(`card with id:${cardId} not found`);

    const { active, expirationDate, singleUse, credit } = card;

    const newCredit = credit - transactionValue;

    //check card is active
    if (!active)
      return res.status(400).send(`card with id:${cardId} is not active`);

    //check card credit
    if (newCredit < 0) {
      return res
        .status(400)
        .send(`insufficient funds, current credit: ${credit}`);
    }

    //check card
    if (expirationDate != "") {
      const isExpired = new Date(expirationDate) < new Date();

      if (isExpired) {
        return res
          .status(400)
          .send(`card with id:${cardId} is not active anymore`);
      }
    }

    await redeemCredit(client, cardId, newCredit);

    //check if singleUse use to deactivate
    if (singleUse || newCredit <= 0) {
      await deactivateCard(client, cardId);
    }

    res.status(200).send(`card redeemed id:${cardId}, credit: ${newCredit}`);
  } catch (e) {
    res.status(500).send(e?.message);
  }
});

// Registro de tarjeta
app.post("/card/register", async function (req, res) {
  const { cardId, email } = req.body;

  if (!cardId || !email) return res.status(400).send("missing cardId or email");

  //TODO: validate email

  try {
    const card = await setEmail(client, cardId, email);
    if (!card) return res.status(400).send(`card with id:${cardId} not found`);
    res.status(200).send(`id: ${cardId} is now linked to email: ${email}`);
  } catch (e) {
    res.status(500).send(e?.message);
  }
});

app.listen(4000);
