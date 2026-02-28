import type { EntityDefinition, FieldDefinition } from "./entity-types.js";

export class EntityRegistry {
  private entities = new Map<string, EntityDefinition>();

  register(entity: EntityDefinition): void {
    this.entities.set(entity.name, entity);
  }

  get(name: string): EntityDefinition | undefined {
    return this.entities.get(name);
  }

  getByPluralName(pluralName: string): EntityDefinition | undefined {
    for (const entity of this.entities.values()) {
      if (entity.pluralName === pluralName) return entity;
    }
    return undefined;
  }

  listAll(): EntityDefinition[] {
    return [...this.entities.values()];
  }

  getWritableFields(name: string): FieldDefinition[] {
    const entity = this.entities.get(name);
    if (!entity) return [];
    return entity.fields.filter((f) => !f.readOnly);
  }

  getRequiredFields(name: string): FieldDefinition[] {
    const entity = this.entities.get(name);
    if (!entity) return [];
    return entity.fields.filter((f) => f.required);
  }

  getFilterableFields(name: string): FieldDefinition[] {
    const entity = this.entities.get(name);
    if (!entity) return [];
    return entity.fields.filter((f) => f.type !== "guid" || f.name === "id");
  }
}
