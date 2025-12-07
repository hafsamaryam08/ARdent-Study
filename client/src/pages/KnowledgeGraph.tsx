import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Maximize2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeGraph() {
  const [zoom, setZoom] = useState(100);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: graphData, isLoading } = useQuery({
    queryKey: ["/api/knowledge-graph"],
  });

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  const categories = ["All", ...new Set(nodes.map((n: any) => n.category))];

  const filteredNodes = nodes.filter((node: any) => {
    const query = searchQuery.toLowerCase().trim();
    // Search by label, category, or definition
    const matchesSearch = !query || 
      node.label.toLowerCase().includes(query) || 
      node.definition.toLowerCase().includes(query) ||
      node.category.toLowerCase().includes(query);
    
    const matchesCategory = selectedCategory === "All" || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedNode = selectedNodeId
    ? nodes.find((n: any) => n.id === selectedNodeId)
    : filteredNodes[0];

  const selectedNodeConnections = edges.filter(
    (e: any) => e.source === selectedNode?.id || e.target === selectedNode?.id
  ).length;

  // Auto-select first node when graph loads
  useEffect(() => {
    if (nodes.length > 0 && !selectedNodeId) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleFullscreen = () => {
    const graphElement = document.getElementById("graph-container");
    if (!graphElement) return;

    if (!document.fullscreenElement) {
      graphElement.requestFullscreen().catch(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Knowledge Graph</h1>
          <p className="text-muted-foreground">Loading your knowledge connections...</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2">Knowledge Graph</h1>
          <p className="text-muted-foreground">Explore connections between concepts you've learned</p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No concepts available yet. Scan content to build your knowledge graph.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryColors: { [key: string]: string } = {
    "AI & ML": "bg-blue-500",
    "Software Engineering": "bg-purple-500",
    "Data Science": "bg-cyan-500",
    "Databases": "bg-emerald-500",
    "Web Development": "bg-orange-500",
    "Biology": "bg-green-500",
    "Chemistry": "bg-red-500",
    "Physics": "bg-yellow-500",
    "Mathematics": "bg-indigo-500",
    "Hardware": "bg-slate-500",
    "Cinematography": "bg-pink-500",
    "General": "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Knowledge Graph</h1>
        <p className="text-muted-foreground">Explore connections between concepts you've learned</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Controls & Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Concepts</CardTitle>
              <CardDescription>Type to search by name or definition</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search by name, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-graph"
                autoFocus
              />
              {searchQuery && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Found: {filteredNodes.length} concept{filteredNodes.length !== 1 ? "s" : ""}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories ({categories.length - 1})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={category === selectedCategory ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start h-auto py-2"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`filter-${category.toLowerCase()}`}
                >
                  <Filter className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{category}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Concept</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">{selectedNode.label}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {selectedNode.category}
                  </Badge>
                </div>
                <div className="text-sm space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Connections:</p>
                    <p className="font-semibold">{selectedNodeConnections}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Definition:</p>
                    <p className="text-xs line-clamp-3">{selectedNode.definition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Graph Visualization */}
        <div id="graph-container" className={`${isFullscreen ? "fixed inset-0 z-50" : "lg:col-span-3"}`}>
          <Card className={isFullscreen ? "h-screen rounded-none" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Concept Map</CardTitle>
                  <CardDescription>
                    {filteredNodes.length} concept{filteredNodes.length !== 1 ? "s" : ""} · {edges.length} connection
                    {edges.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomOut}
                    data-testid="button-graph-zoom-out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomIn}
                    data-testid="button-graph-zoom-in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={handleFullscreen}
                    data-testid="button-fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className={isFullscreen ? "h-full p-0" : ""}>
              {/* Graph Visualization */}
              <div className={`relative ${isFullscreen ? "h-full" : "aspect-video"} bg-gradient-to-br from-background/80 via-muted/30 to-background rounded-lg overflow-hidden border border-border/50 p-6`}>
                <div
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {/* Nodes Grid */}
                  <div className="relative w-full flex flex-wrap gap-3 content-start">
                    {filteredNodes.map((node: any) => {
                      const colorClass = categoryColors[node.category] || "bg-gray-500";
                      const isSelected = node.id === selectedNode?.id;

                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm text-white cursor-pointer transition-all duration-200 ${
                            colorClass
                          } ${isSelected ? "ring-2 ring-offset-2 ring-foreground shadow-lg scale-105" : "hover:opacity-90 shadow"}`}
                          data-testid={`node-${node.id}`}
                          title={node.label}
                        >
                          {node.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from(new Set(nodes.map((n: any) => n.category))).map((category) => (
                  <div key={category} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/50">
                    <div className={`h-3 w-3 rounded-full ${categoryColors[category] || "bg-gray-400"}`} />
                    <span className="text-xs font-medium">{category}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-2xl font-bold" data-testid="stat-total-nodes">
                    {nodes.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Total Concepts</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-2xl font-bold" data-testid="stat-total-connections">
                    {edges.length}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Connections</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-2xl font-bold" data-testid="stat-categories">
                    {categories.length - 1}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
