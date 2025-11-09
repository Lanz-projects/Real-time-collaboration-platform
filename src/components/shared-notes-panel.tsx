import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Edit3, FileText, Users, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { logger } from '../utils/logger';

interface SharedNotesPanelProps {
  isVisible: boolean;
  onClose: () => void;
  currentUser: string;
  currentUserId: string;
  participants: Array<{ name: string; isLocal: boolean }>;
  noteContent: string;
  lockedBy: string | null;
  lockedByName: string | null;
  onAcquireLock: () => void;
  onReleaseLock: () => void;
  onSendNoteUpdate: (content: string) => void;
}

type NotesState = 'initial' | 'editing' | 'viewing';

export function SharedNotesPanel({ 
  isVisible, 
  onClose, 
  currentUser,
  currentUserId,
  participants,
  noteContent,
  lockedBy,
  lockedByName,
  onAcquireLock,
  onReleaseLock,
  onSendNoteUpdate
}: SharedNotesPanelProps) {
  const [notes, setNotes] = useState('');
  const [notesState, setNotesState] = useState<NotesState>('initial');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [viewersList, setViewersList] = useState<string[]>([]);
  const [lastEditTime, setLastEditTime] = useState<number>(Date.now());

  const isReadOnly = !(notesState === 'editing' && editingUser === currentUser);

  logger.log('SharedNotesPanel Debug:', {
    notesState,
    editingUser,
    currentUser,
    isReadOnly,
    lockedBy,
    lockedByName
  });

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  useEffect(() => {
    const otherParticipants = participants.filter(p => p.name !== currentUser);
    const activeViewers = otherParticipants.slice(0, Math.floor(Math.random() * otherParticipants.length) + 1);
    setViewersList(activeViewers.map(p => p.name));
  }, [participants, currentUser]);

  // Sync incoming note updates from other users
  useEffect(() => {
    const isCurrentUserEditing = editingUser === currentUser;
    if (!isCurrentUserEditing && noteContent !== notes) {
      setNotes(noteContent);
      setLastSaved(new Date());
    }
  }, [noteContent, editingUser, currentUser, notes]);

  // Sync editing lock state based on RTM lock ownership
  useEffect(() => {
    if (lockedBy && lockedBy === currentUserId) {
      setNotesState('editing');
      setEditingUser(currentUser);
    } else if (lockedBy && lockedBy !== currentUserId) {
      setNotesState('viewing');
      setEditingUser(lockedByName || lockedBy);
    } else if (!lockedBy) {
      setNotesState('initial');
      setEditingUser(null);
    }
  }, [lockedBy, lockedByName, currentUserId, currentUser]);

  // Debounce note updates to avoid excessive RTM messages
  useEffect(() => {
    const isCurrentUserEditing = editingUser === currentUser;
    if (isCurrentUserEditing && notes !== noteContent) {
      const timer = setTimeout(() => {
        onSendNoteUpdate(notes);
        setLastSaved(new Date());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [notes, editingUser, currentUser, noteContent, onSendNoteUpdate]);

  /**
   * Auto-release lock mechanism for shared notes
   *
   * This prevents a user from accidentally holding the edit lock indefinitely.
   * If a user is editing but doesn't make any changes for 10 seconds, the lock
   * is automatically released so others can edit.
   *
   * The timer resets every time lastEditTime changes (when user types).
   * This ensures active editors keep their lock while idle editors lose it.
   */
  useEffect(() => {
    const isCurrentUserEditing = editingUser === currentUser;
    if (isCurrentUserEditing) {
      const timer = setTimeout(() => {
        logger.log('Auto-releasing lock due to inactivity');
        handleStopEditing();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [lastEditTime, editingUser, currentUser]);

  const handleEditClick = () => {
    if (notesState === 'initial' && !editingUser) {
      onAcquireLock();
      setNotesState('editing');
      setEditingUser(currentUser);
    }
  };

  const handleStopEditing = () => {
    onSendNoteUpdate(notes);
    onReleaseLock();
    setNotesState('initial');
    setEditingUser(null);
    setLastSaved(new Date());
  };

  const handleNotesChange = (content: string) => {
    setNotes(content);
    setLastEditTime(Date.now());
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Meeting Notes', margin, margin);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleString();
      doc.text(`Date: ${dateStr}`, margin, margin + 7);

      doc.text(`Participants: ${participants.length}`, margin, margin + 12);

      doc.setLineWidth(0.5);
      doc.line(margin, margin + 17, pageWidth - margin, margin + 17);

      // Convert HTML content to plain text for PDF export
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = notes || 'No notes available';
      const plainText = tempDiv.textContent || tempDiv.innerText || 'No notes available';

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(plainText, maxWidth);

      let yPosition = margin + 25;
      const lineHeight = 7;

      for (let i = 0; i < lines.length; i++) {
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }

      const filename = `meeting-notes-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      logger.error('Error generating PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (!isVisible) return null;

  const showEmptyState = notesState === 'initial' && !editingUser && notes.length === 0;

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col">
      <div className="w-full h-full flex flex-col border-l border-border bg-white dark:bg-gray-900">
        <div className="flex flex-row items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Shared Notes</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none rounded p-1"
            title="Close"
            aria-label="Close shared notes panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col flex-1 p-4 overflow-hidden">
          <div className="mb-3 p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Collaborative notes - all participants can view and edit
            </p>
          </div>
          {viewersList.length > 0 && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">Currently viewing:</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {viewersList.map((viewer) => (
                  <div key={viewer} className="flex items-center gap-1">
                    <Avatar className="w-4 h-4">
                      <AvatarFallback className="text-xs">
                        {viewer.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-blue-600">{viewer.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingUser && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-lg">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {editingUser.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {editingUser === currentUser ? 'You are editing...' : `${editingUser} is editing...`}
              </span>
              {editingUser !== currentUser && (
                <div className="flex gap-1 ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          )}

          {/* Notes Editor Area */}
          <div className="flex-1 mb-4 relative">
            {showEmptyState ? (
              <div className="h-full">
                <div 
                  className="h-full bg-muted/30 border border-dashed border-border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col justify-center items-center text-center"
                  onClick={handleEditClick}
                >
                  <Edit3 className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-1">Click to edit shared notes</p>
                  <p className="text-sm text-muted-foreground">
                    Add meeting notes that everyone can see
                  </p>
                </div>
              </div>
            ) : (
              <div className={`h-full ${isReadOnly ? 'pointer-events-none opacity-60' : ''}`} role="region" aria-label="Rich text editor for shared meeting notes">
                <ReactQuill
                  theme="snow"
                  value={notes}
                  onChange={handleNotesChange}
                  modules={modules}
                  formats={formats}
                  readOnly={isReadOnly}
                  placeholder="Add shared meeting notes here..."
                  className="h-full flex flex-col"
                  style={{ height: '100%' }}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 mt-16">
            {notesState === 'initial' && !editingUser && (
              <Button onClick={handleEditClick} className="w-full" variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Shared Notes
              </Button>
            )}

            {notesState === 'editing' && editingUser === currentUser && (
              <Button onClick={handleStopEditing} className="w-full">
                Stop Editing
              </Button>
            )}

            {notesState === 'viewing' && editingUser && editingUser !== currentUser && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Waiting for {editingUser} to finish editing...
              </div>
            )}

            {notes.length > 0 && (
              <Button 
                onClick={handleExportPDF} 
                className="w-full" 
                variant="secondary"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Badge variant="outline" className="text-xs">
              {editingUser ? 'Live editing' : 'Real-time sync'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{participants.length} participants have access</span>
          </div>
        </div>
      </div>
    </div>
  );
}