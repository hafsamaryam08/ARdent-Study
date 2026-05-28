import neo4j, { Driver } from "neo4j-driver";
import { log } from "./vite";

const uri = process.env.NEO4J_URI || "neo4j://localhost:7687";
const user = process.env.NEO4J_USERNAME || "87249568";
const password = process.env.NEO4J_PASSWORD || "password";

let driver: Driver | null = null;

export function initNeo4j() {
  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    log(`Neo4j Driver initialized successfully against ${uri}`);
  } catch (error: any) {
    log(`Failed to initialize Neo4j Driver: ${error.message}`);
  }
}

export function getNeo4jDriver(): Driver | null {
  return driver;
}

export async function createConceptNode(concept: any) {
  if (!driver) return;
  const session = driver.session();
  try {
    await session.run(
      `MERGE (c:Concept {id: $id})
       SET c.term = $term, 
           c.category = $category, 
           c.definition = $definition,
           c.userId = $userId,
           c.createdAt = $createdAt`,
      {
        id: concept.id,
        term: concept.term,
        category: concept.category || "General",
        definition: concept.definition || "",
        userId: concept.userId || "system",
        createdAt: concept.createdAt ? concept.createdAt.toISOString() : new Date().toISOString()
      }
    );
  } catch (err: any) {
    log(`Neo4j Error creating concept node: ${err.message}`);
  } finally {
    await session.close();
  }
}

export async function createRelationship(sourceId: string, targetTerm: string) {
  if (!driver) return;
  const session = driver.session();
  try {
    // We match target by term since relatedConcepts are usually strings
    await session.run(
      `MATCH (source:Concept {id: $sourceId})
       MATCH (target:Concept {term: $targetTerm})
       MERGE (source)-[r:RELATED_TO]->(target)`,
      {
        sourceId,
        targetTerm
      }
    );
  } catch (err: any) {
    log(`Neo4j Error creating relationship: ${err.message}`);
  } finally {
    await session.close();
  }
}

export async function fetchKnowledgeGraph() {
  if (!driver) return { nodes: [], edges: [] };
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (n:Concept)
       OPTIONAL MATCH (n)-[r]->(m:Concept)
       RETURN n, r, m`
    );

    const nodesMap = new Map();
    const edges: any[] = [];

    result.records.forEach(record => {
      const n = record.get('n');
      if (n) {
        if (!nodesMap.has(n.properties.id)) {
          nodesMap.set(n.properties.id, {
            id: n.properties.id,
            label: n.properties.term,
            category: n.properties.category,
            definition: n.properties.definition
          });
        }
      }

      const r = record.get('r');
      const m = record.get('m');
      if (r && m) {
        // Ensure m is also added to nodes just in case
        if (!nodesMap.has(m.properties.id)) {
          nodesMap.set(m.properties.id, {
            id: m.properties.id,
            label: m.properties.term,
            category: m.properties.category,
            definition: m.properties.definition
          });
        }
        
        // Ensure no duplicate edges
        const edgeId = `${n.properties.id}-${m.properties.id}`;
        if (!edges.some(e => e.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: n.properties.id,
            target: m.properties.id,
            label: "RELATED_TO"
          });
        }
      }
    });

    return {
      nodes: Array.from(nodesMap.values()),
      edges
    };
  } catch (err: any) {
    log(`Neo4j Error fetching graph: ${err.message}`);
    return { nodes: [], edges: [] };
  } finally {
    await session.close();
  }
}

export async function fetchUserLatestConcepts(userId: string, limit: number = 5) {
  if (!driver) return [];
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (c:Concept {userId: $userId})
       RETURN c.term as term, c.category as category, c.definition as definition
       ORDER BY c.createdAt DESC
       LIMIT $limit`,
      { userId, limit }
    );
    return result.records.map(record => ({
      term: record.get('term'),
      category: record.get('category'),
      definition: record.get('definition')
    }));
  } catch (err: any) {
    log(`Neo4j Error fetching user concepts: ${err.message}`);
    return [];
  } finally {
    await session.close();
  }
}
