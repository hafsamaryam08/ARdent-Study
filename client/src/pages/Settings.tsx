import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, Palette, Shield, Save, Loader2, Upload, Download, FileUp, Globe } from "lucide-react";
import femaleAvatar from "@assets/generated_images/female_student_avatar_portrait.png";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { getLanguage, setLanguage, getAvailableLanguages, type Language } from "@/lib/i18n";
import { exportUserData, downloadAsJSON, importUserData, validateImportFile } from "@/lib/dataExport";

export default function Settings() {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getLanguage());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    learningStyle: "visual",
  });

  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.fullName || "",
        email: user.email || "",
        learningStyle: user.learningStyle || "visual",
      });
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl);
      }
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      updateProfileMutation.mutate({
        fullName: profile.fullName,
        email: profile.email,
        learningStyle: profile.learningStyle,
        avatarUrl: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const [notifications, setNotifications] = useState({
    reviewReminders: true,
    quizResults: true,
    weeklyProgress: false,
    newConcepts: true,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = async () => {
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords don't match",
          variant: "destructive",
        });
        return;
      }
      if (newPassword.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);
    updateProfileMutation.mutate({
      fullName: profile.fullName,
      email: profile.email,
      learningStyle: profile.learningStyle,
      ...(newPassword && { password: newPassword }),
    });
    setIsSaving(false);
  };

  const handleSaveNotifications = () => {
    console.log("Notifications saved", notifications);
    toast({
      title: "Preferences updated",
      description: "Your notification preferences have been saved.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-display font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and learning preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="learning" data-testid="tab-learning">
            <Palette className="h-4 w-4 mr-2" />
            Learning
          </TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" data-testid="tab-privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || femaleAvatar} />
                      <AvatarFallback>
                        {profile.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button 
                        variant="outline" 
                        data-testid="button-change-avatar"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        data-testid="input-avatar"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG or GIF (Max 2MB)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) =>
                          setProfile({ ...profile, fullName: e.target.value })
                        }
                        data-testid="input-fullname"
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        data-testid="input-email"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">New Password (optional)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        data-testid="input-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        data-testid="input-confirm-password"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    data-testid="button-save-profile"
                    disabled={isSaving || updateProfileMutation.isPending}
                  >
                    {isSaving || updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="learningStyle">Preferred Learning Style</Label>
                <Select
                  value={profile.learningStyle}
                  onValueChange={(value) =>
                    setProfile({ ...profile, learningStyle: value })
                  }
                >
                  <SelectTrigger data-testid="select-learning-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual</SelectItem>
                    <SelectItem value="auditory">Auditory</SelectItem>
                    <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
                    <SelectItem value="reading-writing">Reading/Writing</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Content will be tailored to your learning style
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="h-12 w-12 rounded-full bg-chart-1/10 flex items-center justify-center mb-3">
                    <User className="h-6 w-6 text-chart-1" />
                  </div>
                  <h4 className="font-semibold mb-1">Visual</h4>
                  <p className="text-xs text-muted-foreground">
                    Images, diagrams, and videos
                  </p>
                </Card>
                <Card className="p-4">
                  <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-chart-2" />
                  </div>
                  <h4 className="font-semibold mb-1">Auditory</h4>
                  <p className="text-xs text-muted-foreground">
                    Audio summaries and podcasts
                  </p>
                </Card>
                <Card className="p-4">
                  <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center mb-3">
                    <Palette className="h-6 w-6 text-chart-3" />
                  </div>
                  <h4 className="font-semibold mb-1">Kinesthetic</h4>
                  <p className="text-xs text-muted-foreground">
                    Interactive AR experiences
                  </p>
                </Card>
              </div>

              <Button onClick={handleSaveProfile} data-testid="button-save-learning">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-3">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => theme === "dark" && toggleTheme()}
                    data-testid="button-theme-light"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => theme === "light" && toggleTheme()}
                    data-testid="button-theme-dark"
                  >
                    Dark
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current theme: {theme === "light" ? "Light" : "Dark"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </Label>
                <Select
                  value={currentLanguage}
                  onValueChange={(value: Language) => {
                    setCurrentLanguage(value);
                    setLanguage(value);
                    toast({
                      title: "Language changed",
                      description: "Refresh the page to see all changes",
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or import your learning data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsExporting(true);
                    try {
                      const data = await exportUserData();
                      downloadAsJSON(data, `ar-learning-backup-${new Date().toISOString().split('T')[0]}.json`);
                      toast({
                        title: "Export successful",
                        description: "Your data has been downloaded",
                      });
                    } catch (err) {
                      toast({
                        title: "Export failed",
                        description: "Could not export your data",
                        variant: "destructive",
                      });
                    }
                    setIsExporting(false);
                  }}
                  disabled={isExporting}
                  className="flex-1"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => importInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex-1"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileUp className="h-4 w-4 mr-2" />
                  )}
                  Import Data
                </Button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const validation = validateImportFile(file);
                    if (!validation.valid) {
                      toast({
                        title: "Invalid file",
                        description: validation.error,
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsImporting(true);
                    const result = await importUserData(file);
                    setIsImporting(false);

                    if (result.success) {
                      queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
                      toast({
                        title: "Import successful",
                        description: result.message,
                      });
                    } else {
                      toast({
                        title: "Import failed",
                        description: result.message,
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Export your concepts, quizzes, and progress as a backup file
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium">Review Reminders</h4>
                    <p className="text-sm text-muted-foreground">
                      Get notified when it's time to review concepts
                    </p>
                  </div>
                  <Switch
                    checked={notifications.reviewReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, reviewReminders: checked })
                    }
                    data-testid="switch-review-reminders"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium">Quiz Results</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about quiz completions
                    </p>
                  </div>
                  <Switch
                    checked={notifications.quizResults}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, quizResults: checked })
                    }
                    data-testid="switch-quiz-results"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium">Weekly Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Get weekly summaries of your learning progress
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyProgress}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklyProgress: checked })
                    }
                    data-testid="switch-weekly-progress"
                  />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium">New Concepts</h4>
                    <p className="text-sm text-muted-foreground">
                      Alerts when new concepts are added to your graph
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newConcepts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, newConcepts: checked })
                    }
                    data-testid="switch-new-concepts"
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} data-testid="button-save-notifications">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium">Share Progress with Peers</h4>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your learning achievements
                    </p>
                  </div>
                  <Switch data-testid="switch-share-progress" />
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-medium">Contribute to Knowledge Graph</h4>
                    <p className="text-sm text-muted-foreground">
                      Share your notes and insights with the community
                    </p>
                  </div>
                  <Switch defaultChecked data-testid="switch-contribute" />
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <h4 className="font-semibold text-destructive">Danger Zone</h4>
                <Button variant="destructive" data-testid="button-delete-account">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
