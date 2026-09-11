// by_stall.js
// Owner: WILEEN
// TODO: db.payment_events.aggregate([
//   { $match: { event_type: "payment" } },
//   { $group: { _id: "$stall_id", total: { $sum: "$amount" }, count: { $sum: 1 } } }
// ]);
