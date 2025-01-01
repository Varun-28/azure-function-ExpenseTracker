const { app } = require("@azure/functions");
const { sql, poolConnect, pool } = require("../db");

app.http("deleteExpense", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const userId = request.query.get("userId");
      const expenseId = request.query.get("expenseId");

      if (!expenseId || !userId) {
        return {
          status: 400,
          body: "Missing required query parameters: expenseId, userId.",
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
          body: "User does not have permission to delete this expense.",
        };
      }

      const query = `
          DELETE FROM Expenses WHERE ExpenseId = @expenseId;
        `;

      await pool.request().input("expenseId", sql.Int, expenseId).query(query);

      return {
        status: 200,
        body: "Expense deleted successfully.",
      };
    } catch (error) {
      context.log.error(`Error processing request: ${error.message}`);
      return {
        status: 500,
        body: `Error deleting expense: ${error.message}`,
      };
    }
  },
});
