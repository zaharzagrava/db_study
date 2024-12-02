'use strict';

// eslint-disable-next-line
const { v4 } = require('uuid');
// eslint-disable-next-line
const { resolveUuidType, resolveUuidDefaultValue } = require('../configs/utils');

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      if (process.env.DB_TO_MIGRATE === 'postgres') {
        await queryInterface.sequelize.query(
          'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        );
      }

      // {
      //   database: '',
      //   username: 'sa',
      //   password: 'werwerWER1',
      //   host: 'localhost',
      //   port: '1433',
      //   pool: {},
      //   protocol: 'tcp',
      //   native: false,
      //   ssl: undefined,
      //   replication: false,
      //   dialectModule: null,
      //   dialectModulePath: null,
      //   keepDefaultTimezone: undefined,
      //   dialectOptions: undefined
      // }

      // queryInterface.sequelize.config;

      // console.log('@');
      // console.log(queryInterface.sequelize.config);

      // Department
      await queryInterface.createTable(
        'Department',
        {
          id: {
            type: resolveUuidType(Sequelize),
            defaultValue: resolveUuidDefaultValue(Sequelize),
            primaryKey: true,
          },

          name: {
            type: Sequelize.STRING(255),
            unique: false,
            allowNull: false,
          },

          parentId: {
            type: resolveUuidType(Sequelize),
            allowNull: true,
            // onDelete: 'CASCADE',
            // onUpdate: 'CASCADE',
            references: {
              model: 'Department',
              key: 'id',
            },
          },

          zohoId: {
            type: Sequelize.STRING(18),
            allowNull: false,
            unique: false,
          },

          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },

          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },

          deletedAt: {
            allowNull: true,
            type: Sequelize.DATE,
          },
        },
        {
          timestamps: true,
          transaction,
        },
      );

      // TRANSACTION
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS "Department";
    `);
  },
};
