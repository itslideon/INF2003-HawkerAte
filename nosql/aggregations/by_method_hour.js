// by_method_hour.js
// Owner: WILEEN
// Sums grouped by payment method (paynow/card/cash) and hour of day,
// so Lancea can chart peak hours / cash-vs-cashless mix.
//
// Run:  mongosh "<MONGO_URI>/hawkerate" nosql/aggregations/by_method_hour.js

db.payment_events.aggregate([
  { $match: { event_type: "payment" } },
  {
    $group: {
      _id: {
        method: "$method",
        hour: { $hour: "$created_at" },
      },
      total: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  { $sort: { "_id.hour": 1, "_id.method": 1 } },
]).forEach(printjson);
