import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Upload, FileText, Image, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const FileUploadDialog = ({ open, onClose, onSuccess, selectedClass }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [processing, setProcessing] = useState(false);

  if (!open) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Invalid file type. Please upload PDF, Excel, or image files.');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setParsedData(null);
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

      const response = await fetch('http://localhost:8000/api/admin/timetable/parse-file', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setParsedData(data.data);
        toast.success('File parsed successfully! Review the data below.');
      } else {
        toast.error(data.message || 'Failed to parse file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedData) return;

    setProcessing(true);

    try {
      const response = await fetch('http://localhost:8000/api/admin/timetable/create-from-parsed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onSuccess();
        handleClose();
      } else {
        toast.error(data.message || 'Failed to create entries');
      }
    } catch (error) {
      console.error('Error creating entries:', error);
      toast.error('Failed to create entries');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData(null);
    setUploading(false);
    setProcessing(false);
    onClose();
  };

  const getFileIcon = () => {
    if (!file) return <FileText className="w-12 h-12 text-muted-foreground" />;
    
    if (file.type.includes('image')) {
      return <Image className="w-12 h-12 text-blue-500" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="w-12 h-12 text-red-500" />;
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return <File className="w-12 h-12 text-green-500" />;
    }
    return <File className="w-12 h-12 text-muted-foreground" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Import Timetable</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a PDF, Excel, or image file to automatically parse the timetable
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload Section */}
          {!parsedData && (
            <>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png,.webp"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    {getFileIcon()}
                    <div>
                      <p className="text-lg font-medium text-foreground">
                        {file ? file.name : 'Choose a file or drag it here'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supported: PDF, Excel, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                    {!file && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <Upload className="w-4 h-4 mr-2" />
                        Browse Files
                      </Button>
                    )}
                  </div>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon()}
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">AI-Powered Parsing</p>
                    <p className="text-muted-foreground">
                      Our AI will analyze your file and extract timetable information. 
                      If some data cannot be determined, you'll be able to fill it in manually.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Parse File
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Parsed Data Review Section */}
          {parsedData && (
            <>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">File Parsed Successfully</p>
                    <p className="text-muted-foreground">
                      Found {parsedData.slots?.length || 0} time slots and {parsedData.entries?.length || 0} timetable entries.
                      Review the data below and click "Import" to add to your timetable.
                    </p>
                  </div>
                </div>
              </div>

              {/* Slots Preview */}
              {parsedData.slots && parsedData.slots.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Time Slots ({parsedData.slots.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {parsedData.slots.map((slot, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                        <div className="font-medium text-foreground">{slot.slot_name}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          {slot.start_time} - {slot.end_time}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entries Preview */}
              {parsedData.entries && parsedData.entries.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Timetable Entries ({parsedData.entries.length})
                  </h3>
                  <div className="max-h-75 overflow-y-auto space-y-2">
                    {parsedData.entries.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">
                              {entry.subject_name || 'Unknown Subject'}
                              {entry.subject_code && (
                                <span className="text-muted-foreground ml-2">({entry.subject_code})</span>
                              )}
                            </div>
                            <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
                              {entry.teacher_name && <div>Teacher: {entry.teacher_name}</div>}
                              {entry.room_label && <div>Room: {entry.room_label}</div>}
                              {entry.day_of_week && (
                                <div>Day: {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][entry.day_of_week - 1]}</div>
                              )}
                            </div>
                          </div>
                          {entry.session_type && (
                            <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs">
                              {entry.session_type}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleClose}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirm}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Import Timetable
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FileUploadDialog;
