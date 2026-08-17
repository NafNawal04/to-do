// ---- Cypher: get_tasks/get_task callers + indexed-column references ----
MERGE (:Method {name: "crud.py::get_tasks"});
MERGE (:Method {name: "crud.py::get_task"});
MERGE (:Method {name: "main.py::read_tasks"});
MATCH (a:Method {name: "main.py::read_tasks"}), (b:Method {name: "crud.py::get_tasks"}) CREATE (a)-[:CALLS]->(b);
MERGE (:Column {name: "user_id", toBeIndexed: true});
MERGE (:Column {name: "status", toBeIndexed: true});
MERGE (:Column {name: "priority", toBeIndexed: true});
MERGE (:Column {name: "tag", toBeIndexed: true});
MATCH (m:Method {name: "crud.py::get_tasks"}), (c:Column {name: "user_id"}) CREATE (m)-[:FILTERS_ON]->(c);
MATCH (m:Method {name: "crud.py::get_task"}), (c:Column {name: "user_id"}) CREATE (m)-[:FILTERS_ON]->(c);
MATCH (m:Method {name: "crud.py::get_tasks"}), (c:Column {name: "status"}) CREATE (m)-[:FILTERS_ON]->(c);
MATCH (m:Method {name: "crud.py::get_tasks"}), (c:Column {name: "priority"}) CREATE (m)-[:FILTERS_ON]->(c);
MATCH (m:Method {name: "crud.py::get_tasks"}), (c:Column {name: "tag"}) CREATE (m)-[:FILTERS_ON]->(c);
