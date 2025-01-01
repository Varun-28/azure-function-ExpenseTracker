const { app } = require("@azure/functions");
const { sql, poolConnect, pool } = require("../db");

app.http("updateExpense", {
  methods: ["PUT"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = JSON.parse(await request.text());
      const {
        expenseId,
        userId,
        date,
        amount,
        category,
        description,
        isRecurring,
      } = body;

      if (!expenseId || !userId || !amount || !date) {
        return {
          status: 400,
          body: "Missing required fields: expenseId, userId, amount, date.",
        };
      }

      await poolConnect;

      const expenseCheckResult = await pool
        .request()
        .input("expenseId", sql.Int, expenseId)
        .query(
          "SELECT COUNT(*) AS ExpenseExists FROM Expenses WHERE ExpenseId = @expenseId"
        );

      if (expenseCheckResult.recordset[0].ExpenseExists === 0) {
        return { status: 404, body: `Expense with ID ${expenseId} not found.` };
      }

      const userCheckResult = await pool
        .request()
        .input("expenseId", sql.Int, expenseId)
        .query("SELECT UserId FROM Expenses WHERE ExpenseId = @expenseId");

      const userIdFromRequest = Number(userId.trim());
      const userIdFromDb = Number(userCheckResult.recordset[0].UserId);

      if (userIdFromDb !== userIdFromRequest) {
        return {
          status: 403,
          body: "User does not have permission to update this expense.",
        };
      }

      const query = `
          UPDATE Expenses
          SET 
            Amount = @amount,
            Category = @category,
            Description = @description,
            IsRecurring = @isRecurring,
            Date = @date
          WHERE ExpenseId = @expenseId;
        `;

      await pool
        .request()
        .input("expenseId", sql.Int, expenseId)
        .input("userId", sql.Int, userId)
        .input("date", sql.Date, date)
        .input("amount", sql.Decimal(10, 2), amount)
        .input("category", sql.NVarChar(50), category || null)
        .input("description", sql.NVarChar(255), description || null)
        .input("isRecurring", sql.Bit, isRecurring || false)
        .query(query);

      return {
        status: 200,
        body: "Expense updated successfully.",
      };
    } catch (error) {
      context.log.error(`Error processing request: ${error.message}`);
      return {
        status: 500,
        body: `Error updating expense: ${error.message}`,
      };
    }
  },
});
