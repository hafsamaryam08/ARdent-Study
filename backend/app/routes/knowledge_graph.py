from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.db.neo4j_driver import neo4j_driver
import uuid

router = APIRouter(prefix="/api/knowledge-graph", tags=["knowledge-graph"])

class ConceptNode(BaseModel):
    id: str
    name: str
    definition: str

class ConceptRelation(BaseModel):
    concept1_id: str
    concept2_id: str
    relation_type: str = "RELATED_TO"

@router.post("/concepts/create")
def create_concept(concept: ConceptNode):
    """Create a concept node in the knowledge graph."""
    if not neo4j_driver:
        raise HTTPException(status_code=500, detail="Neo4j not available")
    
    try:
        neo4j_driver.create_concept(concept.id, concept.name, concept.definition)
        return {"status": "created", "concept_id": concept.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/relations/create")
def create_relation(relation: ConceptRelation):
    """Create a relationship between concepts."""
    if not neo4j_driver:
        raise HTTPException(status_code=500, detail="Neo4j not available")
    
    try:
        neo4j_driver.link_concepts(
            relation.concept1_id,
            relation.concept2_id,
            relation.relation_type
        )
        return {"status": "linked"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/concepts/{concept_id}/graph")
def get_concept_graph(concept_id: str, depth: int = 2):
    """Get the knowledge graph around a concept."""
    if not neo4j_driver:
        raise HTTPException(status_code=500, detail="Neo4j not available")
    
    try:
        graph = neo4j_driver.get_concept_graph(concept_id, depth)
        return {"concept_id": concept_id, "depth": depth, "nodes": graph}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
