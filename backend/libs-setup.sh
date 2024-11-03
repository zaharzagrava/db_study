cp ./modified-libs/oracledb/connection.js ./node_modules/oracledb/lib/connection.js
cp ./modified-libs/oracledb/resultset.js ./node_modules/oracledb/lib/resultset.js

echo "pg-native"
cp ./modified-libs/pg-native/build-result.js ./node_modules/pg-native/lib/build-result.js
cp ./modified-libs/pg-native/index.js ./node_modules/pg-native/index.js

echo "mysql"
cp ./modified-libs/mysql2/query.js ./node_modules/mysql2/lib/commands/query.js
cp ./modified-libs/mysql2/promise.js ./node_modules/mysql2/promise.js

echo "mariadb"
cp ./modified-libs/mariadb/parser.js ./node_modules/mariadb/lib/cmd/parser.js
