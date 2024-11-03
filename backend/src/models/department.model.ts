import {
  Column,
  Model,
  Table,
  Default,
  IsUUID,
  PrimaryKey,
  BelongsTo,
  HasMany,
  ForeignKey,
  Unique,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  DataType,
  BeforeCreate,
  BeforeBulkCreate,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 } from 'uuid';
import { DbEngine } from 'src/types';

export function fromBinaryUUID(buf: Buffer): string {
  return [
    buf.toString('hex', 4, 8),
    buf.toString('hex', 2, 4),
    buf.toString('hex', 0, 2),
    buf.toString('hex', 8, 10),
    buf.toString('hex', 10, 16),
  ].join('-');
}

export function toBinaryUUID(uuid: string): Buffer {
  const buf = Buffer.from(uuid.replace(/-/g, ''), 'hex');
  return Buffer.concat([
    buf.slice(6, 8),
    buf.slice(4, 6),
    buf.slice(0, 4),
    buf.slice(8, 16),
  ]);
}

export function createBinaryUUID(): { uuid: string; buffer: Buffer } {
  const uuid = v4();
  return Object.assign(Object.create({ toString: () => uuid }), {
    uuid,
    buffer: toBinaryUUID(uuid),
  });
}

// sequelize specific
@Table({
  timestamps: true, // add the timestamp attributes (updatedAt, createdAt)
  paranoid: true, // don't delete database entries but set the newly added attribute deletedAt
  tableName: 'Department',
  modelName: 'Department',
})
// mongoose specific
@Schema()
export default class Department extends Model<Department, Partial<Department>> {
  @IsUUID(4)
  @PrimaryKey
  @Default(uuidv4)
  @Column
  // mongoose specific
  @Prop({ unique: false, required: true })
  id: string;

  @Unique
  @Column
  // mongoose specific
  @Prop({ unique: false, required: true })
  name: string;

  @Unique
  @Column
  // mongoose specific
  @Prop({ unique: false, required: true })
  zohoId: string;

  @ForeignKey(() => Department)
  @Column({ type: DataType.STRING, allowNull: true })
  // mongoose specific
  @Prop()
  parentId: string | null;

  @BelongsTo(() => Department, { foreignKey: 'parentId' })
  parentDepartment: Department;

  @HasMany(() => Department, 'parentId')
  subDepartments: Department[];

  @Prop({ type: Date })
  @CreatedAt
  createdAt: Date;

  @Prop({ type: Date })
  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date | null;

  @BeforeCreate
  static beforeCreateHook(instance: Department): void {
    if (process.env.DB_TO_MIGRATE !== 'mysql') return;

    // instance.dataValues.id = `uuid_to_bin(${instance.id})`;
  }

  @BeforeBulkCreate
  static beforeBulkCreateHook(instances: Department[]): void {
    for (const instance of instances) {
      if (instance.id.includes(DbEngine.mysql)) {
        instance.id = v4();
        instance.dataValues.id = createBinaryUUID().buffer as any;
      }
    }
  }
}

export class DepartmentMariaDb extends Department {}
export class DepartmentMariaDbRemote extends Department {}

export class DepartmentOracleDb extends Department {}
export class DepartmentOracleDbRemote extends Department {}

export class DepartmentMsSQL extends Department {}
export class DepartmentMsSQLRemote extends Department {}

export class DepartmentMySQL extends Department {}
export class DepartmentMySQLRemote extends Department {}

export class DepartmentPostgres extends Department {}
export class DepartmentPostgresRemote extends Department {}

export type DepartmentDocument = HydratedDocument<Department>;
export const DepartmentSchema = SchemaFactory.createForClass(Department);
