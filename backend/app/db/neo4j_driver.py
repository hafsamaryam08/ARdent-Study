from neo4j import GraphDatabase
from app.core.config import settings

class Neo4jDriver:
    def __init__(self):
        self.driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
            encrypted=False
        )
    
    def close(self):
        """Close the driver connection."""
        self.driver.close()
    
    def create_concept(self, concept_id: str, name: str, definition: str):
        """Create a concept node in Neo4j."""
        with self.driver.session() as session:
            session.run(
                """
                CREATE (c:Concept {id: $id, name: $name, definition: $definition})
                """,
                id=concept_id,
                name=name,
                definition=definition
            )
    
    def link_concepts(self, concept1_id: str, concept2_id: str, relation_type: str = "RELATED_TO"):
        """Create a relationship between two concepts."""
        with self.driver.session() as session:
            session.run(
                f"""
                MATCH (c1:Concept {{id: $id1}}), (c2:Concept {{id: $id2}})
                CREATE (c1)-[:{relation_type}]->(c2)
                """,
                id1=concept1_id,
                id2=concept2_id
            )
    
    def get_concept_graph(self, concept_id: str, depth: int = 2):
        """Get related concepts up to specified depth."""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (c:Concept {id: $id})-[*1..""" + str(depth) + """]->(related)
                RETURN c, related
                """,
                id=concept_id
            )
            return [record for record in result]

# Initialize driver
try:
    neo4j_driver = Neo4jDriver()
except Exception as e:
    print(f"Warning: Could not connect to Neo4j: {e}")
    neo4j_driver = None
