import { MongoClient, ObjectId } from "mongodb";

export async function DBConnection() {
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    return client;
  } catch (e) {
    console.error(e);
  }
}

export async function createCard(client, data) {
  const result = await client.db("local").collection("cards").insertOne(data);
  console.log(`New Card id: ${result.insertedId}`);
  return result;
}

export async function getCard(client, cardId) {
  const id = new ObjectId(cardId);
  const result = await client
    .db("local")
    .collection("cards")
    .findOne({ _id: id });

  return result;
}

export async function deactivateCard(client, cardId) {
  const id = new ObjectId(cardId);
  const result = await client
    .db("local")
    .collection("cards")
    .updateOne(
      { _id: id },
      {
        $set: {
          active: false,
        },
      }
    );

  return result;
}

export async function redeemCredit(client, cardId, newCredit) {
  const id = new ObjectId(cardId);
  const result = await client
    .db("local")
    .collection("cards")
    .updateOne(
      { _id: id },
      {
        $set: {
          credit: newCredit,
        },
      }
    );

  return result;
}

export async function setEmail(client, cardId, email) {
  const id = new ObjectId(cardId);
  const result = await client.db("local").collection("cards").updateOne(
    { _id: id },
    {
      $set: {
        email,
      },
    }
  );

  return result;
}
