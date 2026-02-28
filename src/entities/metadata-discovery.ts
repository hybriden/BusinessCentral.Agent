import { XMLParser } from "fast-xml-parser";
import type {
  EntityDefinition,
  FieldDefinition,
  FieldType,
  NavigationProperty,
} from "./entity-types.js";

const EDM_TYPE_MAP: Record<string, FieldType> = {
  "Edm.String": "string",
  "Edm.Int16": "number",
  "Edm.Int32": "number",
  "Edm.Int64": "number",
  "Edm.Decimal": "decimal",
  "Edm.Double": "decimal",
  "Edm.Single": "decimal",
  "Edm.Boolean": "boolean",
  "Edm.Guid": "guid",
  "Edm.Date": "date",
  "Edm.DateTimeOffset": "datetime",
  "Edm.TimeOfDay": "string",
  "Edm.Binary": "string",
  "Edm.Stream": "string",
};

export function parseMetadata(xml: string): EntityDefinition[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) =>
      ["EntityType", "Property", "PropertyRef", "NavigationProperty", "EntitySet"].includes(name),
  });

  const parsed = parser.parse(xml);
  const dataServices = parsed["edmx:Edmx"]["edmx:DataServices"];
  const schema = dataServices["Schema"];

  const entityTypes: any[] = schema["EntityType"] || [];
  const entityContainer = schema["EntityContainer"];
  const entitySets: any[] = entityContainer?.["EntitySet"] || [];

  // Build a map from EntityType name -> EntitySet name (plural)
  const entitySetMap = new Map<string, string>();
  for (const es of entitySets) {
    const entityTypeName = (es["@_EntityType"] as string).split(".").pop()!;
    entitySetMap.set(entityTypeName, es["@_Name"]);
  }

  const entities: EntityDefinition[] = [];

  for (const et of entityTypes) {
    const typeName = et["@_Name"] as string;
    const pluralName = entitySetMap.get(typeName) || typeName + "s";

    // Get key property names
    const keyRefs = et["Key"]?.["PropertyRef"] || [];
    const keyNames = new Set(keyRefs.map((kr: any) => kr["@_Name"]));

    // Parse fields
    const properties: any[] = et["Property"] || [];
    const fields: FieldDefinition[] = properties.map((prop: any) => {
      const edmType = prop["@_Type"] as string;
      const fieldType = EDM_TYPE_MAP[edmType] || "string";
      const name = prop["@_Name"] as string;
      return {
        name,
        type: fieldType,
        readOnly: keyNames.has(name),
        description: `${name} field (${edmType}).`,
        ...(prop["@_MaxLength"]
          ? { maxLength: parseInt(prop["@_MaxLength"], 10) }
          : {}),
      };
    });

    // Parse navigation properties
    const navProps: any[] = et["NavigationProperty"] || [];
    const navigationProperties: NavigationProperty[] = navProps.map(
      (np: any) => {
        const navType = np["@_Type"] as string;
        const isCollection = navType.startsWith("Collection(");
        const targetTypeName = navType
          .replace("Collection(", "")
          .replace(")", "")
          .split(".")
          .pop()!;
        return {
          name: np["@_Name"] as string,
          targetEntity: targetTypeName,
          isCollection,
          description: `Navigation to ${targetTypeName}.`,
        };
      }
    );

    entities.push({
      name: typeName,
      pluralName,
      apiPath: pluralName,
      description: `${typeName} entity discovered from API metadata.`,
      fields,
      navigationProperties,
      boundActions: [],
    });
  }

  return entities;
}
