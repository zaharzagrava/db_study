SELECT "Department"."id",
    "Department"."name",
    "Department"."zohoId",
    "Department"."parentId",
    "Department"."createdAt",
    "Department"."updatedAt",
    "Department"."deletedAt",
    "subDepartments"."id"        AS "subDepartments.id",
    "subDepartments"."name"      AS "subDepartments.name",
    "subDepartments"."zohoId"    AS "subDepartments.zohoId",
    "subDepartments"."parentId"  AS "subDepartments.parentId",
    "subDepartments"."createdAt" AS "subDepartments.createdAt",
    "subDepartments"."updatedAt" AS "subDepartments.updatedAt",
    "subDepartments"."deletedAt" AS "subDepartments.deletedAt"
FROM "Department" AS "Department"
      INNER JOIN "Department" AS "subDepartments"
                  ON "Department"."id" = "subDepartments"."parentId"


SELECT "Department"."id",
       "Department"."name",
       "Department"."zohoId",
       "Department"."parentId",
       "Department"."createdAt",
       "Department"."updatedAt",
       "Department"."deletedAt",
       "subDepartments"."id"        AS "subDepartments.id",
       "subDepartments"."name"      AS "subDepartments.name",
       "subDepartments"."zohoId"    AS "subDepartments.zohoId",
       "subDepartments"."parentId"  AS "subDepartments.parentId",
       "subDepartments"."createdAt" AS "subDepartments.createdAt",
       "subDepartments"."updatedAt" AS "subDepartments.updatedAt",
       "subDepartments"."deletedAt" AS "subDepartments.deletedAt"
FROM "Department" AS "Department"
         LEFT OUTER JOIN "Department" AS "subDepartments"
                         ON "Department"."id" = "subDepartments"."parentId"