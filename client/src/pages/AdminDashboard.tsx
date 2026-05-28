import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  Users,
  BookOpen,
  Camera,
  Award,
  Activity,
  Database,
  Sparkles,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interfaces
interface DiagnosticStatus {
  database: string;
  gemini: string;
  huggingface: string;
  neo4j: string;
}

interface StatsData {
  totalUsers: number;
  totalConcepts: number;
  totalScans: number;
  totalQuizzes: number;
  diagnostics: DiagnosticStatus;
}

interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  learningStyle?: string;
  role?: string;
}

interface ConceptItem {
  id: string;
  term: string;
  definition: string;
  category?: string;
  difficulty?: string;
  modelUrl?: string;
  modelStatus?: string;
}

interface ScannedItem {
  id: string;
  title: string;
  extractedText: string;
  imageUrl?: string;
  concepts?: string[];
  createdAt?: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Editing and Dialog States
  const [editingConcept, setEditingConcept] = useState<ConceptItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewingScan, setViewingScan] = useState<ScannedItem | null>(null);

  // Queries
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<StatsData>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserProfile[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: concepts = [], isLoading: conceptsLoading, refetch: refetchConcepts } = useQuery<ConceptItem[]>({
    queryKey: ["/api/admin/concepts"],
  });

  const { data: scans = [], isLoading: scansLoading, refetch: refetchScans } = useQuery<ScannedItem[]>({
    queryKey: ["/api/admin/scans"],
  });

  // Diagnostics Retest Mutation
  const [diagnosticsRetesting, setDiagnosticsRetesting] = useState(false);
  const retestDiagnostics = async () => {
    setDiagnosticsRetesting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/diagnostics/retest");
      const results = await response.json();
      
      queryClient.setQueryData(["/api/admin/stats"], (old: any) => ({
        ...old,
        diagnostics: results,
      }));

      toast({
        title: "Telemetry Refreshed",
        description: "System connection health checked successfully.",
      });
    } catch (e: any) {
      toast({
        title: "Diagnostics Failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setDiagnosticsRetesting(false);
    }
  };

  // Concept Mutations
  const updateConceptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ConceptItem> }) => {
      const res = await apiRequest("PUT", `/api/admin/concepts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/concepts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Concept Updated", description: "The database record was updated successfully." });
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteConceptMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/concepts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/concepts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Concept Deleted", description: "Concept has been removed from taxonomy." });
    },
    onError: (err: any) => {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    },
  });

  // Scanned Page Mutations
  const deleteScanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/scans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Scan Deleted", description: "Scanned textbook page cleared." });
    },
    onError: (err: any) => {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    },
  });

  // User Mutations
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Student Roster Updated", description: "User account deleted." });
    },
    onError: (err: any) => {
      toast({ title: "Deletion Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleEditConcept = (concept: ConceptItem) => {
    setEditingConcept(concept);
    setIsEditOpen(true);
  };

  const handleSaveConcept = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingConcept) return;
    updateConceptMutation.mutate({
      id: editingConcept.id,
      data: {
        term: editingConcept.term,
        definition: editingConcept.definition,
        category: editingConcept.category,
        difficulty: editingConcept.difficulty,
        modelUrl: editingConcept.modelUrl,
        modelStatus: editingConcept.modelStatus,
      },
    });
  };

  // Filtered Concepts list
  const filteredConcepts = concepts.filter((c) => {
    const matchesSearch = c.term.toLowerCase().includes(searchText.toLowerCase()) || 
      c.definition.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = Array.from(
    new Set(concepts.map((c) => c.category).filter(Boolean))
  ) as string[];

  // Render Telemetry Lights
  const renderDiagnosticLight = (status: string) => {
    const isSuccess = status && (status.includes("✅") || status.includes("Success"));
    const isWarning = status && (status.includes("⚠️") || status.includes("Fallback"));
    
    return (
      <div className="flex items-center gap-3 bg-muted/30 px-4 py-3 rounded-xl border border-border/50">
        <div className="relative flex h-3 w-3">
          {isSuccess ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </>
          ) : isWarning ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </>
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider">{status || "Unknown status"}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Visual Portal Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/10 p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary-foreground border-primary/30 bg-primary/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest gap-1.5 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations Console
            </Badge>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-white flex items-center gap-3">
            <Sliders className="h-9 w-9 text-primary" /> Instructor Portal
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Curriculum Curation, System Analytics, and Deep Telemetry Diagnostics for the ARdent Study ecosystem.
          </p>
        </div>
        
        <div className="flex items-center gap-3 z-10 self-start md:self-auto">
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/10 gap-2 font-bold backdrop-blur-md"
            onClick={() => {
              refetchStats();
              refetchUsers();
              refetchConcepts();
              refetchScans();
            }}
          >
            <RefreshCw className="h-4 w-4" /> Refresh All Records
          </Button>
        </div>
      </div>

      {/* Main Tabs Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] h-12 bg-muted/40 backdrop-blur-md p-1 border rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl font-bold text-xs uppercase tracking-wider">Overview</TabsTrigger>
          <TabsTrigger value="concepts" className="rounded-xl font-bold text-xs uppercase tracking-wider">Curation</TabsTrigger>
          <TabsTrigger value="scans" className="rounded-xl font-bold text-xs uppercase tracking-wider">Scans</TabsTrigger>
          <TabsTrigger value="students" className="rounded-xl font-bold text-xs uppercase tracking-wider">Students</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview & Telemetry */}
        <TabsContent value="overview" className="space-y-8 outline-none">
          {/* Glowing Summaries */}
          {statsLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="h-28 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Users Count */}
              <Card className="relative overflow-hidden group hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Students</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Users className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats?.totalUsers}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Registrations in Neon SQL</p>
                </CardContent>
              </Card>

              {/* Scans Count */}
              <Card className="relative overflow-hidden group hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pages Scanned</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Camera className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats?.totalScans}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Textbooks ingested</p>
                </CardContent>
              </Card>

              {/* Concepts Count */}
              <Card className="relative overflow-hidden group hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Concepts</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-500"><BookOpen className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats?.totalConcepts}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Compiled academic terms</p>
                </CardContent>
              </Card>

              {/* Quizzes Count */}
              <Card className="relative overflow-hidden group hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quizzes Taken</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"><Award className="h-4 w-4" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">{stats?.totalQuizzes}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">AI evaluators triggered</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Telemetry diagnostics panel */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" /> Core Connectivity Diagnostics
                  </CardTitle>
                  <CardDescription>Live health checks for active databases and custom learning engines</CardDescription>
                </div>
                
                <Button
                  size="sm"
                  className="font-bold text-xs gap-2"
                  onClick={retestDiagnostics}
                  disabled={diagnosticsRetesting}
                >
                  <RefreshCw className={`h-3 w-3 ${diagnosticsRetesting ? "animate-spin" : ""}`} />
                  {diagnosticsRetesting ? "Testing..." : "Test Connections"}
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Primary DB */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Database className="h-3 w-3" /> Primary Database Cluster (Neon)
                    </span>
                    {statsLoading ? (
                      <div className="h-10 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      renderDiagnosticLight(stats?.diagnostics?.database || "Connected (Active) ✅")
                    )}
                  </div>

                  {/* OCR / Parser */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Semantic Language & OCR Pipeline
                    </span>
                    {statsLoading ? (
                      <div className="h-10 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      renderDiagnosticLight(stats?.diagnostics?.gemini || "Configured (Ready) ✅")
                    )}
                  </div>

                  {/* 3D Reconstruction */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Sliders className="h-3 w-3" /> 3D Geometric Reconstruction Engine
                    </span>
                    {statsLoading ? (
                      <div className="h-10 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      renderDiagnosticLight(stats?.diagnostics?.huggingface || "Configured (Ready) ✅")
                    )}
                  </div>

                  {/* Relationship Graph */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-3 w-3" /> Knowledge Relationship Graph DB
                    </span>
                    {statsLoading ? (
                      <div className="h-10 bg-muted animate-pulse rounded-xl" />
                    ) : (
                      renderDiagnosticLight(stats?.diagnostics?.neo4j || "Configured (Ready) ✅")
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-muted/50 to-muted/20 border border-border/60 flex flex-col justify-between shadow-lg">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-primary" /> Curators Notice
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  As an instructor, you have administrative permission to curate database records. 
                  If automated geometric mesh reconstruction generates distorted shapes for a concept, you can override its **modelUrl** inside the <strong>Curation Tab</strong>, mapping it to a pre-constructed high-fidelity asset from our scientific models library.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Button
                  size="sm"
                  className="w-full font-bold gap-2 text-xs"
                  onClick={() => setActiveTab("concepts")}
                >
                  Go to Curation Suite <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Concept Curation Suite */}
        <TabsContent value="concepts" className="space-y-6 outline-none">
          <Card className="shadow-lg">
            <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Concept Curation Suite
                </CardTitle>
                <CardDescription>Review, edit, and delete academic terms and 3D configurations</CardDescription>
              </div>

              {/* Filters / Search */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search concepts..."
                    className="pl-9 h-9"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {conceptsLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filteredConcepts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic text-sm">
                  No concepts match your current filters.
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-2">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-bold">Term</TableHead>
                        <TableHead className="font-bold">Category</TableHead>
                        <TableHead className="font-bold">Difficulty</TableHead>
                        <TableHead className="font-bold">3D Mesh Status</TableHead>
                        <TableHead className="font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    
                    <TableBody>
                      <AnimatePresence>
                        {filteredConcepts.map((concept) => (
                          <TableRow key={concept.id} className="hover:bg-muted/30">
                            {/* Term & Definition */}
                            <TableCell className="font-semibold max-w-xs">
                              <div>{concept.term}</div>
                              <div className="text-[10px] text-muted-foreground truncate max-w-xs font-normal mt-0.5">
                                {concept.definition}
                              </div>
                            </TableCell>

                            {/* Category */}
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0.5">
                                {concept.category || "General"}
                              </Badge>
                            </TableCell>

                            {/* Difficulty */}
                            <TableCell>
                              <span className="text-xs capitalize font-medium">{concept.difficulty || "Intermediate"}</span>
                            </TableCell>

                            {/* Mesh Status */}
                            <TableCell>
                              {concept.modelUrl ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[9px] font-black uppercase">
                                  AI Mesh Ready
                                </Badge>
                              ) : concept.modelStatus === "generating" ? (
                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 text-[9px] font-black uppercase animate-pulse">
                                  Generating...
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[9px] font-black uppercase">
                                  Procedural Fallback
                                </Badge>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 hover:text-primary hover:bg-primary/5"
                                  onClick={() => handleEditConcept(concept)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 hover:text-destructive hover:bg-destructive/5"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${concept.term}"?`)) {
                                      deleteConceptMutation.mutate(concept.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Scanned Textbook Auditor */}
        <TabsContent value="scans" className="space-y-6 outline-none">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" /> Textbook Scan Auditor
              </CardTitle>
              <CardDescription>Audit images and OCR textbook content uploaded by students</CardDescription>
            </CardHeader>
            
            <CardContent>
              {scansLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : scans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic text-sm">
                  No scanned textbook pages currently exist in the database.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scans.map((scan) => (
                    <Card key={scan.id} className="relative overflow-hidden group border border-border/50 flex flex-col justify-between hover:shadow-xl hover:border-primary/20 transition-all duration-300 rounded-2xl bg-muted/10">
                      <div>
                        {/* Scan Image preview */}
                        {scan.imageUrl ? (
                          <div className="aspect-video w-full bg-slate-900 overflow-hidden relative border-b">
                            <img
                              src={scan.imageUrl}
                              alt={scan.title}
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-4 right-4">
                              <h3 className="text-sm font-black text-white truncate uppercase tracking-tight">{scan.title}</h3>
                              <p className="text-[9px] text-slate-300 mt-0.5">Scanned: {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : "Unknown date"}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video w-full bg-slate-900 flex items-center justify-center text-slate-500 border-b">
                            <FileText className="h-10 w-10 opacity-30" />
                          </div>
                        )}

                        <div className="p-4 space-y-3">
                          {/* Mapped Concepts badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {scan.concepts && scan.concepts.length > 0 ? (
                              scan.concepts.map((conceptName) => (
                                <Badge key={conceptName} variant="secondary" className="text-[8px] font-black uppercase tracking-tighter px-1.5">
                                  {conceptName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[9px] text-muted-foreground italic">No concepts mapped</span>
                            )}
                          </div>

                          {/* Extracted snippet */}
                          <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-muted/40 p-2.5 rounded-lg border border-border/40 font-mono">
                            {scan.extractedText}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 pt-0 border-t border-border/40 flex items-center justify-between mt-3 bg-muted/10">
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-bold text-[10px] h-8 gap-1.5"
                          onClick={() => setViewingScan(scan)}
                        >
                          <Eye className="h-3.5 w-3.5" /> Full Extracted Text
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete scan: "${scan.title}"?`)) {
                              deleteScanMutation.mutate(scan.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Student Audit Roster */}
        <TabsContent value="students" className="space-y-6 outline-none">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Student Audit Roster
              </CardTitle>
              <CardDescription>View, audit, and clean user registrations</CardDescription>
            </CardHeader>
            
            <CardContent>
              {usersLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-bold">Student Name</TableHead>
                      <TableHead className="font-bold">Username</TableHead>
                      <TableHead className="font-bold">Email</TableHead>
                      <TableHead className="font-bold">Learning Style</TableHead>
                      <TableHead className="font-bold">System Role</TableHead>
                      <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  
                  <TableBody>
                    {users.map((profile) => (
                      <TableRow key={profile.id} className="hover:bg-muted/30">
                        {/* Full Name */}
                        <TableCell className="font-semibold">{profile.fullName || "Unspecified student"}</TableCell>
                        
                        {/* Username */}
                        <TableCell className="font-mono text-xs">{profile.username}</TableCell>
                        
                        {/* Email */}
                        <TableCell className="text-xs text-muted-foreground">{profile.email || "No email"}</TableCell>
                        
                        {/* Learning Style */}
                        <TableCell>
                          {profile.learningStyle ? (
                            <Badge variant="secondary" className="capitalize text-[10px] font-bold">
                              {profile.learningStyle}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None specified</span>
                          )}
                        </TableCell>

                        {/* System Role */}
                        <TableCell>
                          <Badge
                            className={`text-[9px] font-black uppercase ${
                              profile.role === "admin" 
                                ? "bg-indigo-500/10 text-indigo-600 border-indigo-200" 
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                            variant={profile.role === "admin" ? "default" : "outline"}
                          >
                            {profile.role || "student"}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-full"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user "${profile.username}"?`)) {
                                deleteUserMutation.mutate(profile.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* dialog for Editing concept */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-black tracking-tight text-foreground flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" /> Curate Concept Blueprint
            </DialogTitle>
            <DialogDescription className="text-xs">
              Refine the scientific description or manually override the AI 3D asset file path.
            </DialogDescription>
          </DialogHeader>

          {editingConcept && (
            <form onSubmit={handleSaveConcept} className="space-y-4 pt-2">
              <div className="grid gap-4">
                {/* Term */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="term" className="text-right font-bold text-xs uppercase text-muted-foreground">Term</Label>
                  <Input
                    id="term"
                    className="col-span-3 h-10 font-bold"
                    value={editingConcept.term}
                    onChange={(e) => setEditingConcept({ ...editingConcept, term: e.target.value })}
                    required
                  />
                </div>

                {/* Definition */}
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="definition" className="text-right font-bold text-xs uppercase text-muted-foreground pt-2">Definition</Label>
                  <Textarea
                    id="definition"
                    rows={4}
                    className="col-span-3 leading-relaxed text-xs resize-none"
                    value={editingConcept.definition}
                    onChange={(e) => setEditingConcept({ ...editingConcept, definition: e.target.value })}
                    required
                  />
                </div>

                {/* Category & Difficulty */}
                <div className="grid grid-cols-2 gap-4 col-span-4 pl-[7.5rem]">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="font-bold text-[10px] uppercase text-muted-foreground">Category</Label>
                    <Select
                      value={editingConcept.category || "General"}
                      onValueChange={(val) => setEditingConcept({ ...editingConcept, category: val })}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AI & ML">AI & ML</SelectItem>
                        <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Biology">Biology</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="difficulty" className="font-bold text-[10px] uppercase text-muted-foreground">Difficulty</Label>
                    <Select
                      value={editingConcept.difficulty || "intermediate"}
                      onValueChange={(val) => setEditingConcept({ ...editingConcept, difficulty: val })}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Model GLTF URL */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="modelUrl" className="text-right font-bold text-xs uppercase text-muted-foreground">3D Asset Path</Label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id="modelUrl"
                      placeholder="/generated_models/concept_id.glb"
                      className="h-10 font-mono text-xs"
                      value={editingConcept.modelUrl || ""}
                      onChange={(e) => setEditingConcept({ ...editingConcept, modelUrl: e.target.value })}
                    />
                    <p className="text-[9px] text-muted-foreground italic leading-none pl-1">
                      Override with a local asset like: <code>/models/heart.glb</code>, <code>/models/brain_project.glb</code>
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t gap-2 md:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="font-bold text-xs"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="font-bold text-xs"
                  disabled={updateConceptMutation.isPending}
                >
                  {updateConceptMutation.isPending ? "Saving..." : "Save Curation"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* dialog for Viewing Scan Text */}
      <Dialog open={!!viewingScan} onOpenChange={(open) => !open && setViewingScan(null)}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl border border-border/80 bg-background/95 backdrop-blur-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-black tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Full Extracted Textbook OCR
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct digital capture of textbooks mapped during OCR ingestion.
            </DialogDescription>
          </DialogHeader>

          {viewingScan && (
            <ScrollArea className="max-h-[350px] p-4 rounded-xl border bg-muted/30 font-mono text-xs leading-relaxed leading-6 whitespace-pre-wrap select-all">
              {viewingScan.extractedText}
            </ScrollArea>
          )}

          <DialogFooter className="border-t pt-4">
            <Button
              className="font-bold text-xs"
              onClick={() => setViewingScan(null)}
            >
              Close Reader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
