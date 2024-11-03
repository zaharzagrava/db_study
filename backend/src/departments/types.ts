import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TimestampsFields } from 'src/types';

export enum DepartmentView {
  TEAMS = 'TEAMS',
  APPROVE = 'APPROVE',
  ADJUST = 'ADJUST',
}

export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsNotEmpty()
  @IsString()
  zohoId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  parentId?: string | null;

  @ApiProperty()
  deletedAt?: Date | null;
}

export class DepartmentDto extends IntersectionType(
  CreateDepartmentDto,
  TimestampsFields,
) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'DepartmentDto' })
  parentDepartment: DepartmentDto;

  @Type(() => DepartmentDto)
  @ApiProperty({
    type: DepartmentDto,
    isArray: true,
    example: ['DepartmentDto'],
  })
  subDepartments: DepartmentDto[];
}

export class DepartmentTreeDto extends IntersectionType(
  CreateDepartmentDto,
  TimestampsFields,
) {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  id: string;

  @IsOptional()
  @Type(() => String)
  @ApiProperty({ type: String, isArray: true })
  breadCrumbs?: string[];

  sharedKpis: any[];

  @Type(() => DepartmentTreeDto)
  @ApiProperty({
    type: DepartmentTreeDto,
    isArray: true,
    example: ['DepartmentTreeDto'],
  })
  subDepartments: DepartmentTreeDto[];
}
