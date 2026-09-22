// by_stall.js
// Owner: WILEEN
// Total amount & count of payment_events per stall_id (payments only,
// refunds excluded — pair with by_stall net if you need payments-minus-refunds).
//
// Run:  mongosh "<MONGO_URI>/hawkerate" nosql/aggregations/by_stall.js

db.payment_events.aggregate([
  { $match: { event_type: "payment" } },
  {
    $group: {
      _id: "$stall_id",
      total: { $sum: "$amount" },
      count: { $sum: 1 },
    },
  },
  { $sort: { total: -1 } },
]).forEach(printjson);
