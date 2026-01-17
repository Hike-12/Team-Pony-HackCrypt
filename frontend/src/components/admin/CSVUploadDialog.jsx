import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CSVUploadDialog({ 
  open, 
  onOpenChange, 
  onUploadSuccess, 
  uploadEndpoint,
  title = "Upload CSV",
  description = "Upload a CSV file"
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_URL}${uploadEndpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data);
        toast.success(data.message || 'Upload successful');
        
        // Call success callback after a short delay to show results
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess(data.data);
          }
        }, 2000);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FileText className="h-10 w-10 text-primary mb-2" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload CSV file
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-3 mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-sm">Upload Results:</h4>
              
              {results.added && results.added.length > 0 && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">
                      Successfully added: {results.added.length}
                    </p>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {results.added.slice(0, 5).map((item, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          • {item.name || item.fullname || item.subject_name || JSON.stringify(item)}
                        </p>
                      ))}
                      {results.added.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... and {results.added.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {results.skipped && results.skipped.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-600">
                      Skipped: {results.skipped.length}
                    </p>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {results.skipped.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          • {item.reason || 'Already exists'}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {results.errors && results.errors.length > 0 && (
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">
                      Errors: {results.errors.length}
                    </p>
                    <div className="mt-1 max-h-32 overflow-y-auto">
                      {results.errors.slice(0, 3).map((item, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          • {item.error}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!results && (
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
