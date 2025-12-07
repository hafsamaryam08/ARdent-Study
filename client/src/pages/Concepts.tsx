import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function Concepts() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: concepts = [], isLoading } = useQuery({
    queryKey: ["/api/concepts"],
  });

  const [selectedConcept, setSelectedConcept] = useState<any>(concepts[0] || null);

  const filteredConcepts = concepts.filter((concept: any) =>
    concept.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">My Concepts</h1>
          <p className="text-muted-foreground">Loading your concepts...</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="lg:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  if (concepts.length > 0 && !selectedConcept) {
    setSelectedConcept(concepts[0]);
  }

  if (concepts.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">My Concepts</h1>
          <p className="text-muted-foreground">No concepts yet. Scan some content to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">My Concepts</h1>
        <p className="text-muted-foreground">
          Browse and review your learned concepts with AI-enhanced resources
        </p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-concepts"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Concept List */}
        <div className="lg:col-span-1 space-y-3">
          {filteredConcepts.map((concept: any) => (
            <Card
              key={concept.id}
              className={`cursor-pointer hover-elevate ${
                selectedConcept?.id === concept.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedConcept(concept)}
              data-testid={`card-concept-${concept.term}`}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{concept.term}</h3>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {concept.category || "General"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Concept Details */}
        <div className="lg:col-span-2">
          {selectedConcept ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedConcept.term}</CardTitle>
                    <CardDescription className="mt-2">
                      {selectedConcept.definition}
                    </CardDescription>
                  </div>
                  <Badge>{selectedConcept.category || "General"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList>
                    <TabsTrigger value="info" data-testid="tab-info">Info</TabsTrigger>
                    <TabsTrigger value="related" data-testid="tab-related">Related</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-semibold mb-3">Definition</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConcept.definition}
                      </p>
                    </div>
                    {selectedConcept.multimediaResources && selectedConcept.multimediaResources.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3">Resources</h3>
                        <div className="space-y-2">
                          {selectedConcept.multimediaResources.map((resource: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                              data-testid={`resource-${index}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <span className="text-sm font-medium">{resource.type}</span>
                                  {resource.url && (
                                    <a
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-primary hover:underline block"
                                    >
                                      View Resource
                                    </a>
                                  )}
                                </div>
                              </div>
                              {resource.url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="related" className="space-y-6 mt-6">
                    <div>
                      <h3 className="font-semibold mb-3">Related Concepts</h3>
                      {selectedConcept.relatedConcepts && selectedConcept.relatedConcepts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedConcept.relatedConcepts.map((related: string, index: number) => (
                            <Badge key={index} variant="outline">{related}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No related concepts yet</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Select a concept to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
