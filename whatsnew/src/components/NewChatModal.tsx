import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, UserCheck, Users, Check, Sparkles } from 'lucide-react';
import { WhatsAppAvatar } from './WhatsAppAvatar';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onAddNewPerson: (name: string) => Promise<void>;
  onCreateGroup?: (groupName: string, memberNames: string[]) => Promise<void>;
  initialTab?: 'direct' | 'group';
}

interface ServerUser {
  id: string;
  name: string;
  avatar: string;
  about?: string;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onAddNewPerson,
  onCreateGroup,
  initialTab = 'direct',
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>(initialTab);
  const [personName, setPersonName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<ServerUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [customMemberInput, setCustomMemberInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPersonName('');
      setGroupName('');
      setSelectedGroupMembers([]);
      setCustomMemberInput('');
      setError(null);
      return;
    }

    setActiveTab(initialTab);

    // Fetch existing registered users on the server
    fetch('/api/users')
      .then((res) => res.json())
      .then((data: ServerUser[]) => {
        if (Array.isArray(data)) {
          setAvailableUsers(data.filter((u) => u.id !== currentUserId));
        }
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, [isOpen, currentUserId, initialTab]);

  if (!isOpen) return null;

  const handleSubmitDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = personName.trim();
    if (!trimmed) {
      setError('Bitte gib einen Namen ein.');
      return;
    }
    if (trimmed.length < 2) {
      setError('Der Name muss mindestens 2 Zeichen lang sein.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddNewPerson(trimmed);
      setPersonName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hinzufügen der Person.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUser = async (name: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onAddNewPerson(name);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hinzufügen der Person.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroupMember = (name: string) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleAddCustomMember = () => {
    const trimmed = customMemberInput.trim().replace(/^@+/, '');
    if (!trimmed) return;
    if (!selectedGroupMembers.includes(trimmed)) {
      setSelectedGroupMembers((prev) => [...prev, trimmed]);
    }
    setCustomMemberInput('');
  };

  const handleSubmitGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName || trimmedGroupName.length < 2) {
      setError('Bitte gib einen Gruppennamen mit mindestens 2 Zeichen ein.');
      return;
    }

    if (selectedGroupMembers.length === 0) {
      setError('Bitte wähle mindestens ein Gruppenmitglied aus.');
      return;
    }

    if (!onCreateGroup) {
      setError('Gruppenerstellung wird nicht unterstützt.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateGroup(trimmedGroupName, selectedGroupMembers);
      setGroupName('');
      setSelectedGroupMembers([]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Gruppe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-[#d1d7db] flex flex-col max-h-[640px] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#008069] bg-[#008069] text-white">
          <div className="flex items-center gap-2.5">
            {activeTab === 'direct' ? (
              <UserPlus className="w-5 h-5" />
            ) : (
              <Users className="w-5 h-5" />
            )}
            <h3 className="font-semibold text-base">
              {activeTab === 'direct' ? 'Neuer Chat / Person' : 'Neue WhatsApp Gruppe'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e9edef] bg-[#f0f2f5] text-xs font-semibold text-[#54656f]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('direct');
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'direct'
                ? 'border-[#008069] text-[#008069] bg-white'
                : 'border-transparent hover:text-[#111b21]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>1:1 Direktchat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('group');
              setError(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'group'
                ? 'border-[#008069] text-[#008069] bg-white'
                : 'border-transparent hover:text-[#111b21]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Neue Gruppe</span>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {error && (
            <div className="p-3 mb-4 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: Direktchat */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <form onSubmit={handleSubmitDirect} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#41525d] mb-1.5">
                    Name der Person (z. B. Alex, Dennis, Sarah)
                  </label>
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 w-4 h-4 text-[#8696a0]" />
                    <input
                      type="text"
                      required
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="Name oder @Name eingeben..."
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-[#f0f2f5] focus:bg-white rounded-lg border border-transparent focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all"
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="mt-2 p-2.5 bg-[#d9fdd3]/50 rounded-lg border border-[#00a884]/20 text-[11px] text-[#111b21] flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#008069] shrink-0 mt-0.5" />
                    <span>
                      <strong>Echtzeit-Synchronisierung:</strong> Sobald du diesen Chat erstellst, ist er sofort auch im Konto dieser Person sichtbar (sowohl wenn sie bereits eingeloggt ist, als auch wenn sie sich später anmeldet)!
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#f0f2f5] rounded-lg"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !personName.trim()}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#008069] hover:bg-[#00a884] rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Erstelle Chat...</span>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Chat starten</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Registered server users list */}
              {availableUsers.length > 0 && (
                <div className="mt-5 pt-4 border-t border-[#f0f2f5]">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#54656f]">
                      <UserCheck className="w-4 h-4 text-[#00a884]" />
                      <span>Verfügbare Kontakte:</span>
                    </div>
                    <span className="text-[11px] text-[#8696a0]">
                      {availableUsers.length} Kontakte
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {availableUsers
                      .filter((user) => {
                        if (!personName.trim()) return true;
                        const searchClean = personName.trim().replace(/^@+/, '').toLowerCase();
                        return user.name.toLowerCase().includes(searchClean);
                      })
                      .map((user) => (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user.name)}
                          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#f5f6f6] cursor-pointer transition-colors border border-transparent hover:border-[#d1d7db] group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <WhatsAppAvatar
                              name={user.name}
                              avatarUrl={user.avatar}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-semibold text-xs text-[#111b21] truncate">{user.name}</h4>
                                <span className="text-[10px] text-[#008069] font-medium bg-[#008069]/10 px-1.5 py-0.5 rounded font-mono">
                                  @{user.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8696a0] truncate">{user.about || 'Auf WhatsApp'}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-[#008069] group-hover:bg-[#008069] group-hover:text-white font-medium bg-[#008069]/10 px-2.5 py-1 rounded transition-colors shrink-0 ml-2">
                            Chat starten
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Neue Gruppe */}
          {activeTab === 'group' && (
            <form onSubmit={handleSubmitGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#41525d] mb-1.5">
                  Gruppenbetreff / Name
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="z. B. Familie, Urlaub 2026, Entwickler..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#f0f2f5] focus:bg-white rounded-lg border border-transparent focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884] outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Add custom member input */}
              <div>
                <label className="block text-xs font-semibold text-[#41525d] mb-1.5">
                  Weiteres Mitglied hinzufügen
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMemberInput}
                    onChange={(e) => setCustomMemberInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomMember();
                      }
                    }}
                    placeholder="Name eingeben (z. B. Dennis)..."
                    className="flex-1 px-3.5 py-2 text-xs bg-[#f0f2f5] focus:bg-white rounded-lg border border-transparent focus:border-[#00a884] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomMember}
                    disabled={!customMemberInput.trim()}
                    className="px-3 py-2 text-xs font-semibold bg-[#008069] text-white rounded-lg disabled:opacity-50"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>

              {/* Selected members badge list */}
              {selectedGroupMembers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#41525d] mb-1.5">
                    Ausgewählte Mitglieder ({selectedGroupMembers.length}):
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-[#f0f2f5] rounded-lg border border-[#e9edef]">
                    {selectedGroupMembers.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#008069] text-white font-medium shadow-xs"
                      >
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() => toggleGroupMember(name)}
                          className="hover:text-rose-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pick from contacts */}
              {availableUsers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#41525d] mb-1.5">
                    Mitglieder aus Kontakten auswählen:
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto border border-[#e9edef] rounded-lg p-1.5 bg-white">
                    {availableUsers.map((user) => {
                      const isSelected = selectedGroupMembers.includes(user.name);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleGroupMember(user.name)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#d9fdd3]' : 'hover:bg-[#f5f6f6]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <WhatsAppAvatar
                              name={user.name}
                              avatarUrl={user.avatar}
                              size="xs"
                            />
                            <span className="text-xs font-medium text-[#111b21] truncate">
                              {user.name}
                            </span>
                          </div>
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#008069] border-[#008069] text-white'
                                : 'border-[#8696a0]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#f0f2f5] rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !groupName.trim() || selectedGroupMembers.length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#008069] hover:bg-[#00a884] rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Erstelle Gruppe...</span>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      <span>Gruppe erstellen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
