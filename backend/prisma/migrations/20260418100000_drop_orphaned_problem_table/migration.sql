-- Drop orphaned Problem table — this model had no relations to any other table
-- and was never used by any controller or route. Removed from schema.prisma in the same commit.
DROP TABLE IF EXISTS "Problem";
