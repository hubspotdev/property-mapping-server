    
CREATE TABLE "public"."Mapping" (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  label VARCHAR(255)
  "hubspotName" VARCHAR(255)
  "hubspotLabel" VARCHAR(255)
);
