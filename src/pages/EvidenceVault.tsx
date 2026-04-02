import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderLock, Upload, File, Image, FileText, Trash2, Download, Plus,
  Calendar, Link as LinkIcon, Search, Filter, Eye, Grid3X3, List, HardDrive,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewItem, setPreviewItem] = useState<EvidenceItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const { data: evidence, isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence-vault', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('evidence_vault').select('*').eq('user_id', user.id).order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as EvidenceItem[];
    },
    enabled: !!user,
  });

  const { data: cases } = useQuery({
    queryKey: ['analysis-cases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('analysis_history').select('id, analysis_type, category, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      return data as AnalysisCase[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: EvidenceItem) => {
      const filePath = item.file_url.split('/').slice(-2).join('/');
      await supabase.storage.from('evidence-vault').remove([filePath]);
      const { error } = await supabase.from('evidence_vault').delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-vault'] });
      toast({ title: 'Evidence deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete evidence', variant: 'destructive' });
    },
  });

  // Filtered evidence
  const filteredEvidence = useMemo(() => {
    let items = evidence || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.file_name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    if (filterType !== 'all') {
      if (filterType === 'image') items = items.filter(i => i.file_type.startsWith('image/'));
      else if (filterType === 'pdf') items = items.filter(i => i.file_type.includes('pdf'));
      else if (filterType === 'linked') items = items.filter(i => i.case_id);
      else items = items.filter(i => !i.file_type.startsWith('image/') && !i.file_type.includes('pdf'));
    }
    return items;
  }, [evidence, searchQuery, filterType]);

  // Stats
  const totalSize = evidence?.reduce((acc, e) => acc + (e.file_size || 0), 0) || 0;
  const imageCount = evidence?.filter(e => e.file_type.startsWith('image/')).length || 0;
  const docCount = evidence?.filter(e => !e.file_type.startsWith('image/')).length || 0;
  const linkedCount = evidence?.filter(e => e.case_id).length || 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
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
      const { error: uploadError } = await supabase.storage.from('evidence-vault').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('evidence-vault').getPublicUrl(fileName);
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
      toast({ title: 'Upload failed', description: 'Could not upload the file.', variant: 'destructive' });
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
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading || evidenceLoading) {
    return <DashboardLayout><div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" text="Loading evidence vault..." /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10"><FolderLock className="h-6 w-6 text-primary" /></div>
              <h1 className="text-2xl font-display font-bold">Evidence Vault</h1>
            </div>
            <p className="text-muted-foreground">Securely store screenshots, documents, and files related to your cases.</p>
          </div>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Upload Evidence</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Evidence</DialogTitle>
                <DialogDescription>Add screenshots, PDFs, or documents to your secure vault.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>File</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input type="file" onChange={handleFileSelect} className="hidden" id="file-upload" accept="image/*,.pdf,.doc,.docx,.txt" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <File className="h-5 w-5 text-primary" />
                          <span className="font-medium">{selectedFile.name}</span>
                          <span className="text-sm text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                        </div>
                      ) : (
                        <div><Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-sm text-muted-foreground">Click to select a file (max 10MB)</p></div>
                      )}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Link to Case (Optional)</Label>
                  <Select value={selectedCase} onValueChange={setSelectedCase}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select a case" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked case</SelectItem>
                      {cases?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.analysis_type.toUpperCase()} - {c.category || 'Uncategorized'} ({new Date(c.created_at).toLocaleDateString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea placeholder="Describe what this evidence shows..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/50" />
                </div>
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
                  {isUploading ? <LoadingSpinner size="sm" /> : <><Upload className="h-4 w-4 mr-2" />Upload Evidence</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <HardDrive className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">{evidence?.length || 0}</span>
            <span className="text-xs text-muted-foreground">Total Files</span>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <Image className="h-5 w-5 text-warning" />
            <span className="text-xl font-bold">{imageCount}</span>
            <span className="text-xs text-muted-foreground">Images</span>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <FileText className="h-5 w-5 text-success" />
            <span className="text-xl font-bold">{docCount}</span>
            <span className="text-xs text-muted-foreground">Documents</span>
          </CardContent></Card>
          <Card><CardContent className="p-4 flex flex-col items-center text-center gap-1">
            <LinkIcon className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold">{linkedCount}</span>
            <span className="text-xs text-muted-foreground">Linked to Cases</span>
          </CardContent></Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search evidence..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] bg-secondary/50"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="linked">Linked Only</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-md">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Evidence Display */}
        {filteredEvidence.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvidence.map((item) => {
                const FileIcon = getFileIcon(item.file_type);
                return (
                  <div key={item.id} className="glass-card rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                    {/* Image Preview */}
                    {item.file_type.startsWith('image/') && (
                      <div className="h-36 bg-secondary/30 overflow-hidden cursor-pointer" onClick={() => setPreviewItem(item)}>
                        <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {!item.file_type.startsWith('image/') && (
                          <div className="p-3 rounded-lg bg-secondary/50"><FileIcon className="h-6 w-6 text-primary" /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{item.file_name}</h3>
                          <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</p>
                          {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />{format(new Date(item.uploaded_at), 'MMM d, yyyy')}
                          </div>
                          {item.case_id && <Badge variant="outline" className="mt-1 text-xs text-primary border-primary/30"><LinkIcon className="h-3 w-3 mr-1" />Linked</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => item.file_type.startsWith('image/') ? setPreviewItem(item) : window.open(item.file_url, '_blank')}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(item.file_url, '_blank')}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => deleteMutation.mutate(item)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvidence.map((item) => {
                const FileIcon = getFileIcon(item.file_type);
                return (
                  <div key={item.id} className="glass-card rounded-lg p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                    {item.file_type.startsWith('image/') ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setPreviewItem(item)}>
                        <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-secondary/50 flex-shrink-0"><FileIcon className="h-5 w-5 text-primary" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.file_size)} • {format(new Date(item.uploaded_at), 'MMM d, yyyy')}</p>
                    </div>
                    {item.case_id && <Badge variant="outline" className="text-xs text-primary border-primary/30">Linked</Badge>}
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => item.file_type.startsWith('image/') ? setPreviewItem(item) : window.open(item.file_url, '_blank')}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.file_url, '_blank')}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger" onClick={() => deleteMutation.mutate(item)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="glass-card rounded-xl p-12 text-center">
            <FolderLock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-display font-semibold mb-2">{searchQuery || filterType !== 'all' ? 'No Matching Evidence' : 'No Evidence Yet'}</h3>
            <p className="text-muted-foreground mb-4">{searchQuery || filterType !== 'all' ? 'Try adjusting your search or filters.' : 'Start collecting screenshots, PDFs, and documents to build your case.'}</p>
            {!searchQuery && filterType === 'all' && (
              <Button onClick={() => setIsUploadOpen(true)}><Plus className="h-4 w-4 mr-2" />Upload Your First Evidence</Button>
            )}
          </div>
        )}

        {/* Image Preview Dialog */}
        <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewItem?.file_name}</DialogTitle>
              {previewItem?.description && <DialogDescription>{previewItem.description}</DialogDescription>}
            </DialogHeader>
            {previewItem && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden bg-secondary/30 max-h-[60vh] flex items-center justify-center">
                  <img src={previewItem.file_url} alt={previewItem.file_name} className="max-w-full max-h-[60vh] object-contain" />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatFileSize(previewItem.file_size)} • {format(new Date(previewItem.uploaded_at), 'MMMM d, yyyy h:mm a')}</span>
                  <Button variant="outline" size="sm" onClick={() => window.open(previewItem.file_url, '_blank')}><Download className="h-4 w-4 mr-2" />Download</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Storage Info */}
        <div className="glass-card rounded-xl p-4 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3">
            <FolderLock className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="font-medium text-sm">Your evidence is secure</p>
              <p className="text-xs text-muted-foreground">All files are encrypted and only accessible by you. Total storage used: {formatFileSize(totalSize)}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
