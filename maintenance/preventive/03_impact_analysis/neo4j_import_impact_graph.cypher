// ---- Cypher: app.js functions sharing the duplicated fetch/401 pattern ----
MERGE (:File {name: "app.js"});
MERGE (:Function {name: "fetchTasks", inDuplicationCluster: true});
MERGE (:Function {name: "handleTaskSubmit", inDuplicationCluster: true});
MERGE (:Function {name: "toggleTaskStatus", inDuplicationCluster: true});
MERGE (:Function {name: "deleteTask", inDuplicationCluster: true});
MATCH (f:File {name: "app.js"}), (fn:Function {name: "fetchTasks"}) CREATE (f)-[:DEFINES]->(fn);
MATCH (f:File {name: "app.js"}), (fn:Function {name: "handleTaskSubmit"}) CREATE (f)-[:DEFINES]->(fn);
MATCH (f:File {name: "app.js"}), (fn:Function {name: "toggleTaskStatus"}) CREATE (f)-[:DEFINES]->(fn);
MATCH (f:File {name: "app.js"}), (fn:Function {name: "deleteTask"}) CREATE (f)-[:DEFINES]->(fn);
MATCH (fn:Function {name: "fetchTasks"}) SET fn.fetchLine = 270;
MATCH (fn:Function {name: "handleTaskSubmit"}) SET fn.fetchLine = 368;
MATCH (fn:Function {name: "toggleTaskStatus"}) SET fn.fetchLine = 395;
MATCH (fn:Function {name: "deleteTask"}) SET fn.fetchLine = 420;
