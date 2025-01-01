const { app } = require("@azure/functions");
const { sql, poolConnect, pool } = require("../db");

app.http("addExpense", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = JSON.parse(await request.text());
      const { userId, date, amount, category, description, isRecurring } = body;

      if (!userId || !date || !amount) {
        return {
          status: 400,
          body: "Missing required fields: userId, date, amount.",
        };
      }

      await poolConnect;

      const userCheckResult = await pool
        .request()
        .input("userId", sql.Int, userId)
        .query(
          "SELECT COUNT(*) AS UserExists FROM Users WHERE UserId = @userId"
        );

      if (userCheckResult.recordset[0].UserExists === 0) {
        return { status: 400, body: `User with ID ${userId} does not exist.` };
      }

      const query = `
                INSERT INTO Expenses (UserId, Date, Amount, Category, Description, IsRecurring)
                VALUES (@userId, @date, @amount, @category, @description, @isRecurring);
            `;

      await pool
        .request()
        .input("UserId", sql.Int, userId)
        .input("Date", sql.Date, date)
        .input("Amount", sql.Decimal(10, 2), amount)
        .input("Category", sql.NVarChar(50), category || null)
        .input("Description", sql.NVarChar(255), description || null)
        .input("IsRecurring", sql.Bit, isRecurring || false)
        .query(query);

      return {
        status: 201,
        body: "Expense created successfully.",
      };
    } catch (error) {
      context.log.error(`Error processing request: ${error.message}`);
      return {
        status: 500,
        body: `Error creating expense: ${error.message}`,
      };
    }
  },
});
