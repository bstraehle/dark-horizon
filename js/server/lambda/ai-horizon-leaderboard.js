import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "ai-horizon-leaderboard";

/**
 * Lambda handler
 * @param {{httpMethod:string,queryStringParameters?:Record<string,string>,body?:string}} event
 */
export const handler = async (event) => {
  try {
    const { httpMethod, queryStringParameters, body } = event;
    let response;
    let updateData;

    switch (httpMethod) {
      case "GET":
        if (queryStringParameters && queryStringParameters.id) {
          response = await getItem(Number(queryStringParameters.id));
        } else {
          return { statusCode: 400, body: JSON.stringify({ message: "Missing id" }) };
        }
        break;

      case "PUT":
        if (!queryStringParameters || !queryStringParameters.id) {
          return { statusCode: 400, body: JSON.stringify({ message: "Missing id" }) };
        }
        if (!body) {
          return { statusCode: 400, body: JSON.stringify({ message: "Missing body" }) };
        }
        updateData = JSON.parse(body);
        response = await updateItem(Number(queryStringParameters.id), updateData);
        break;

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method not allowed" }),
        };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: message,
      }),
    };
  }
};

/**
 * @param {number} id
 */
async function getItem(id) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
  };

  const command = new GetCommand(params);
  const result = await docClient.send(command);

  if (!result.Item) {
    throw new Error(`Item with id ${id} not found`);
  }

  return result.Item;
}

/**
 * Update an item in the leaderboard table.
 * @param {number} id
 * @param {{[key:string]: any}} updateData
 * @returns {Promise<{message:string,item:any}>}
 */
async function updateItem(id, updateData) {
  /** @type {{[key:string]: any}} */
  // ensure we don't send id in the update payload
  delete updateData.id;

  updateData.updatedAt = new Date().toISOString();

  /** @type {string[]} */
  const updateExpressions = [];
  /** @type {{[key:string]: string}} */
  const expressionAttributeNames = {};
  /** @type {{[key:string]: any}} */
  const expressionAttributeValues = {};

  Object.keys(updateData).forEach((key, index) => {
    const attributeName = `#attr${index}`;
    const attributeValue = `:val${index}`;

    updateExpressions.push(`${attributeName} = ${attributeValue}`);
    expressionAttributeNames[attributeName] = key;
    expressionAttributeValues[attributeValue] = updateData[key];
  });

  const params = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: "attribute_exists(id)",
    ReturnValues: "ALL_NEW",
  };

  const command = new UpdateCommand(params);
  const result = await docClient.send(command);

  return {
    message: "Item updated successfully",
    item: result.Attributes,
  };
}
