import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-west-2" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "ai-horizon-leaderboard";

export const handler = async (event) => {
  try {
    const { httpMethod, queryStringParameters, body } = event;
    let response;
    let updateData;

    switch (httpMethod) {
      case "GET":
        if (queryStringParameters && queryStringParameters.id) {
          response = await getItem(+queryStringParameters.id);
        } else {
          response = await getAllItems();
        }
        break;

      /*case 'POST':
                const newItem = JSON.parse(body);
                response = await createItem(newItem);
                break;*/

      case "PUT":
        updateData = JSON.parse(body);
        response = await updateItem(+queryStringParameters.id, updateData);
        break;

      /*case 'DELETE':
                response = await deleteItem(+queryStringParameters.id);
                break;*/

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
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};

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

async function getAllItems() {
  const params = {
    TableName: TABLE_NAME,
  };

  const command = new ScanCommand(params);
  const result = await docClient.send(command);

  return {
    items: result.Items,
    count: result.Count,
  };
}

/*async function createItem(item) {
    item.createdAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();
    
    const params = {
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(id)'
    };

    const command = new PutCommand(params);
    await docClient.send(command);
    
    return {
        message: 'Item created successfully',
        item: item
    };
}*/

async function updateItem(id, updateData) {
  delete updateData.id;

  updateData.updatedAt = new Date().toISOString();

  const updateExpressions = [];
  const expressionAttributeNames = {};
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

/*async function deleteItem(id) {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            id: id
        },
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_OLD'
    };

    const command = new DeleteCommand(params);
    const result = await docClient.send(command);
    
    return {
        message: 'Item deleted successfully',
        deletedItem: result.Attributes
    };
}*/

/*async function queryItems(partitionKey, sortKeyCondition = null) {
    const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'id = :pk',
        ExpressionAttributeValues: {
            ':pk': partitionKey
        }
    };
    
    if (sortKeyCondition) {
        params.KeyConditionExpression += ' AND ' + sortKeyCondition.expression;
        Object.assign(params.ExpressionAttributeValues, sortKeyCondition.values);
    }

    const command = new QueryCommand(params);
    const result = await docClient.send(command);
    
    return {
        items: result.Items,
        count: result.Count
    };
}*/
