import { z, type ZodTypeAny } from "zod";
import type { EntityDefinition, FieldDefinition } from "./entity-types.js";

export type HandlerType = "list" | "get" | "create" | "update" | "delete" | "count" | "action";

export interface GeneratedTool {
  name: string;
  description: string;
  inputSchema: Record<string, ZodTypeAny>;
  handler: HandlerType;
  entityName: string;
  actionNavPath?: string;
}

function fieldTypeToZod(field: FieldDefinition): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (field.type) {
    case "string":
    case "date":
    case "datetime":
    case "guid":
      schema = z.string();
      break;
    case "number":
    case "decimal":
      schema = z.number();
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "enum":
      if (field.enumValues && field.enumValues.length > 0) {
        schema = z.enum(field.enumValues as [string, ...string[]]);
      } else {
        schema = z.string();
      }
      break;
    default:
      schema = z.string();
  }

  if (field.description) {
    schema = schema.describe(field.description);
  }

  return schema;
}

function buildListSchema(): Record<string, ZodTypeAny> {
  return {
    filter: z.string().optional().describe("OData $filter expression to filter results"),
    select: z.string().optional().describe("Comma-separated list of fields to include in the response"),
    expand: z.string().optional().describe("Comma-separated list of navigation properties to expand"),
    top: z.number().optional().describe("Maximum number of records to return"),
    skip: z.number().optional().describe("Number of records to skip"),
    orderBy: z.string().optional().describe("OData $orderby expression to sort results"),
  };
}

function buildGetSchema(): Record<string, ZodTypeAny> {
  return {
    id: z.string().describe("The unique identifier (GUID) of the record"),
    expand: z.string().optional().describe("Comma-separated list of navigation properties to expand"),
  };
}

function buildCreateSchema(entity: EntityDefinition): Record<string, ZodTypeAny> {
  const schema: Record<string, ZodTypeAny> = {};
  const writableFields = entity.fields.filter((f) => !f.readOnly);

  for (const field of writableFields) {
    let fieldSchema = fieldTypeToZod(field);
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }
    schema[field.name] = fieldSchema;
  }

  return schema;
}

function buildUpdateSchema(entity: EntityDefinition): Record<string, ZodTypeAny> {
  const schema: Record<string, ZodTypeAny> = {
    id: z.string().describe("The unique identifier (GUID) of the record to update"),
  };

  const writableFields = entity.fields.filter((f) => !f.readOnly && f.name !== "id");

  for (const field of writableFields) {
    let fieldSchema = fieldTypeToZod(field);
    fieldSchema = fieldSchema.optional();
    schema[field.name] = fieldSchema;
  }

  return schema;
}

function buildDeleteSchema(): Record<string, ZodTypeAny> {
  return {
    id: z.string().describe("The unique identifier (GUID) of the record to delete"),
  };
}

function buildCountSchema(): Record<string, ZodTypeAny> {
  return {
    filter: z.string().optional().describe("OData $filter expression to filter records before counting"),
  };
}

function buildActionSchema(): Record<string, ZodTypeAny> {
  return {
    id: z.string().describe("The unique identifier (GUID) of the record to perform the action on"),
  };
}

export function generateToolsForEntity(entity: EntityDefinition): GeneratedTool[] {
  const tools: GeneratedTool[] = [];

  // List tool
  tools.push({
    name: `bc_list_${entity.pluralName}`,
    description: `List ${entity.pluralName} from Business Central. ${entity.description}. Supports OData filtering, sorting, pagination, and field selection.`,
    inputSchema: buildListSchema(),
    handler: "list",
    entityName: entity.name,
  });

  // Get tool
  tools.push({
    name: `bc_get_${entity.name}`,
    description: `Get a single ${entity.name} by ID from Business Central. ${entity.description}.`,
    inputSchema: buildGetSchema(),
    handler: "get",
    entityName: entity.name,
  });

  // Count tool
  tools.push({
    name: `bc_count_${entity.pluralName}`,
    description: `Count the number of ${entity.pluralName} in Business Central. Supports OData filtering to count a subset of records.`,
    inputSchema: buildCountSchema(),
    handler: "count",
    entityName: entity.name,
  });

  // Mutation tools (only for non-read-only entities)
  if (!entity.isReadOnly) {
    // Create tool
    tools.push({
      name: `bc_create_${entity.name}`,
      description: `Create a new ${entity.name} in Business Central. ${entity.description}.`,
      inputSchema: buildCreateSchema(entity),
      handler: "create",
      entityName: entity.name,
    });

    // Update tool
    tools.push({
      name: `bc_update_${entity.name}`,
      description: `Update an existing ${entity.name} in Business Central by ID. Only specified fields will be updated.`,
      inputSchema: buildUpdateSchema(entity),
      handler: "update",
      entityName: entity.name,
    });

    // Delete tool
    tools.push({
      name: `bc_delete_${entity.name}`,
      description: `Delete a ${entity.name} from Business Central by ID.`,
      inputSchema: buildDeleteSchema(),
      handler: "delete",
      entityName: entity.name,
    });

    // Bound action tools
    for (const action of entity.boundActions) {
      tools.push({
        name: `bc_${action.name}_${entity.name}`,
        description: `${action.description} for a ${entity.name} in Business Central.`,
        inputSchema: buildActionSchema(),
        handler: "action",
        entityName: entity.name,
        actionNavPath: action.navPath,
      });
    }
  }

  return tools;
}
