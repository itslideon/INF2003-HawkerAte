// review_search.js
// Owner: WILEEN
// Text search over reviews.comment for a given stall, non-deleted only.
// The text index itself is created once by setup_collections.py; the
// createIndex call here is a no-op if it already exists.
//
// Run:  mongosh "<MONGO_URI>/hawkerate" nosql/aggregations/review_search.js

db.reviews.createIndex({ comment: "text" });

const STALL_ID = "1";
const SEARCH_TERM = "queue";

db.reviews.find(
  {
    stall_id: STALL_ID,
    is_deleted: false,
    $text: { $search: SEARCH_TERM },
  },
  { score: { $meta: "textScore" } }
)
  .sort({ score: { $meta: "textScore" } })
  .forEach(printjson);
