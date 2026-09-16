import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const vehiclesTable = pgTable("vehicles", {
  id: text("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  variant: text("variant").notNull().default(""),
  year: integer("year").notNull(),
  price: integer("price").notNull(),
  mileage: integer("mileage").notNull(),
  fuel: text("fuel").notNull(),
  transmission: text("transmission").notNull(),
  bodyType: text("body_type").notNull(),
  colour: text("colour").notNull(),
  location: text("location").notNull().default("St Albans"),
  status: text("status").notNull().default("available"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  description: text("description").notNull().default(""),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  specs: jsonb("specs")
    .$type<{ label: string; value: string }[]>()
    .notNull()
    .default([]),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  condition: text("condition").notNull().default("Used"),
  doors: integer("doors"),
  engineSize: text("engine_size"),
  registrationDate: text("registration_date"),
  registrationPlate: text("registration_plate"),
  videoUrl: text("video_url"),
  viewCount: integer("view_count").notNull().default(0),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Vehicle = typeof vehiclesTable.$inferSelect;
export type InsertVehicle = typeof vehiclesTable.$inferInsert;
export type UpdateVehicle = Partial<Omit<InsertVehicle, "id">>;
