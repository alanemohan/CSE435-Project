import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FolderLock,
  Upload,
  File,
  Image,
  FileText,
  Trash2,
  Download,
  Plus,
  Calendar,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EvidenceItem {
  id: string;
  user_id: string;
  case_id: string | null;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  description: string | null;
  uploaded_at: string;
}

interface AnalysisCase {
  id: string;
  analysis_type: string;
  category: string | null;
  created_at: string;
}

export default function EvidenceVault() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCase, setSelectedCase] = useState<string>('none');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch evidence items
  const { data: evidence, isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence-vault', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('evidence_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as EvidenceItem[];
    },
    enabled: !!user,
  });

  // Fetch user's analysis cases
  const { data: cases } = useQuery({
    queryKey: ['analysis-cases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('analysis_history')
        .select('id, analysis_type, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as AnalysisCase[];
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (item: EvidenceItem) => {
      // Delete from storage
      const filePath = item.file_url.split('/').slice(-2).join('/');
      await supabase.storage.from('evidence-vault').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('evidence_vault')
        .delete()
        .eq('id', item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-vault'] });
      toast({ title: 'Evidence deleted successfully' });
    },
    onError: () => {
      toast({
        title: 'Failed to delete evidence',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('evidence-vault')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('evidence-vault')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase.from('evidence_vault').insert({
        user_id: user.id,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_url: urlData.publicUrl,
        file_size: selectedFile.size,
        description: description || null,
        case_id: selectedCase === 'none' ? null : selectedCase,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['evidence-vault'] });
      toast({ title: 'Evidence uploaded successfully' });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setDescription('');
      setSelectedCase('none');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Could not upload the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading || evidenceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" text="Loading evidence vault..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderLock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">Evidence Vault</h1>
            </div>
            <p className="text-muted-foreground">
              Securely store screenshots, documents, and files related to your cases.
            </p>
          </div>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Upload Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Evidence</DialogTitle>
                <DialogDescription>
                  Add screenshots, PDFs, or documents to your secure vault.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <File className="h-5 w-5 text-primary" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({formatFileSize(selectedFile.size)})
                          </span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to select a file (max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Link to Case (Optional)</Label>
                  <Select value={selectedCase} onValueChange={setSelectedCase}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked case</SelectItem>
                      {cases?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.analysis_type.toUpperCase()} - {c.category || 'Uncategorized'} (
                          {new Date(c.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Describe what this evidence shows..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Evidence
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Evidence Grid */}
        {evidence && evidence.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {evidence.map((item) => {
              const FileIcon = getFileIcon(item.file_type);
              return (
                <div
                  key={item.id}
                  className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <FileIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.file_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.file_size)}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </div>
                      {item.case_id && (
                        <div className="flex items-center gap-1 mt-1">
                          <LinkIcon className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary">Linked to case</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(item.file_url, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-danger hover:text-danger hover:bg-danger/10"
                      onClick={() => deleteMutation.mutate(item)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <FolderLock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-display font-semibold mb-2">No Evidence Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start collecting screenshots, PDFs, and documents to build your case.
            </p>
            <Button onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Evidence
            </Button>
          </div>
        )}

        {/* Security Notice */}
        <div className="glass-card rounded-xl p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <FolderLock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Your evidence is secure</p>
              <p className="text-xs text-muted-foreground">
                All files are encrypted and only accessible by you. Files are automatically deleted after 90 days unless linked to an active case.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
