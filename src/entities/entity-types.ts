export type FieldType = "string" | "number" | "boolean" | "date" | "datetime" | "guid" | "decimal" | "enum";

export interface FieldDefinition {
  name: string;
  type: FieldType;
  readOnly?: boolean;
  required?: boolean;
  description: string;
  enumValues?: string[];
  maxLength?: number;
}

export interface NavigationProperty {
  name: string;
  targetEntity: string;
  isCollection: boolean;
  description: string;
}

export interface BoundAction {
  name: string;
  description: string;
  httpMethod: "POST";
  navPath: string;
  hasRequestBody?: boolean;
}

export interface EntityDefinition {
  name: string;
  pluralName: string;
  apiPath: string;
  description: string;
  fields: FieldDefinition[];
  navigationProperties: NavigationProperty[];
  boundActions: BoundAction[];
  isReadOnly?: boolean;
  parentEntity?: string;
  parentNavigationProperty?: string;
}
