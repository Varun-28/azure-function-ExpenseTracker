const { app } = require("@azure/functions");
const { sql, poolConnect, pool } = require("../db");

app.http("getExpense", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const userId = request.query.get("userId");
      const expenseId = request.query.get("expenseId");

      if (!userId) {
        return {
          status: 400,
          body: "Missing required query parameter: userId.",
        };
      }

      await poolConnect;

      let query = `SELECT * FROM Expenses WHERE UserId = @userId`;
      if (expenseId) {
        query += ` AND ExpenseId = @expenseId`;
      }

      const result = await pool
        .request()
        .input("userId", sql.Int, userId)
        .input("expenseId", sql.Int, expenseId)
        .query(query);

      return {
        status: 200,
        jsonBody: result.recordset,
      };
    } catch (error) {
      context.log.error(`Error processing request: ${error.message}`);
      return {
        status: 500,
        body: `Error fetching expenses: ${error.message}`,
      };
    }
  },
});
