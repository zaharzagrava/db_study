const resolveUuidType = (Sequelize) => {
  if (process.env.DB_TO_MIGRATE === 'postgres') {
    return Sequelize.UUID;
  } else if (process.env.DB_TO_MIGRATE === 'mysql') {
    return `BINARY(16)`;
  } else if (process.env.DB_TO_MIGRATE === 'mssql') {
    return `UNIQUEIDENTIFIER`;
  } else if (process.env.DB_TO_MIGRATE === 'oracle') {
    return Sequelize.UUID;
  } else if (process.env.DB_TO_MIGRATE === 'mariadb') {
    return Sequelize.UUID;
  }

  throw new Error('Unsupported DB for uuid type');
};

const resolveUuidDefaultValue = (Sequelize) => {
  if (process.env.DB_TO_MIGRATE === 'postgres') {
    return Sequelize.UUIDV4;
  } else if (process.env.DB_TO_MIGRATE === 'mysql') {
    return Sequelize.literal('(UUID_TO_BIN(UUID(), true))');
  } else if (process.env.DB_TO_MIGRATE === 'mssql') {
    return Sequelize.literal(`NEWID()`);
  } else if (process.env.DB_TO_MIGRATE === 'oracle') {
    return Sequelize.UUIDV4;
  } else if (process.env.DB_TO_MIGRATE === 'mariadb') {
    return Sequelize.UUIDV4;
  }

  throw new Error('Unsupported DB for uuid default value');
};

module.exports.resolveUuidType = resolveUuidType;
module.exports.resolveUuidDefaultValue = resolveUuidDefaultValue;
