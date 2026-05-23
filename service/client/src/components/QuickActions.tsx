import React, { useState } from 'react';
import * as Icons from './Icons';

export interface QuickAction {
  id: string;
  name: string;
  command: string;
  color: string;
  icon: string;
}

interface QuickActionsProps {
  quickActions: QuickAction[];
  onSendCommand: (command: string) => void;
  onAddQuickAction: (action: Omit<QuickAction, 'id'>) => void;
  onDeleteQuickAction: (id: string) => void;
}

const ICONS_LIST = ['Save', 'Users', 'Sun', 'Cloud', 'Power', 'MessageSquare'];
const COLORS_LIST = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
];

export const QuickActions: React.FC<QuickActionsProps> = ({
  quickActions,
  onSendCommand,
  onAddQuickAction,
  onDeleteQuickAction,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newIcon, setNewIcon] = useState('Save');
  
  const [confirmStopId, setConfirmStopId] = useState<string | null>(null);

  const handleIcon = (iconName: string, size = 20) => {
    switch (iconName) {
      case 'Save':
        return <Icons.SaveIcon size={size} />;
      case 'Users':
        return <Icons.UsersIcon size={size} />;
      case 'Sun':
        return <Icons.SunIcon size={size} />;
      case 'Cloud':
        return <Icons.CloudIcon size={size} />;
      case 'Power':
        return <Icons.PowerIcon size={size} />;
      case 'MessageSquare':
        return <Icons.MessageSquareIcon size={size} />;
      default:
        return <Icons.PlayIcon size={size} />;
    }
  };

  const isDefaultAction = (id: string) => {
    const idNum = parseInt(id, 10);
    return !isNaN(idNum) && idNum >= 1 && idNum <= 6;
  };

  const handleActionClick = (action: QuickAction) => {
    const isDangerous = action.command.trim().toLowerCase() === 'stop' || 
                        action.command.trim().toLowerCase().startsWith('stop ');
    
    if (isDangerous) {
      setConfirmStopId(action.id);
    } else {
      onSendCommand(action.command);
    }
  };

  const handleConfirmStop = (action: QuickAction) => {
    onSendCommand(action.command);
    setConfirmStopId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCommand.trim()) return;

    onAddQuickAction({
      name: newName.trim(),
      command: newCommand.trim(),
      color: newColor,
      icon: newIcon,
    });

    // Reset Form
    setNewName('');
    setNewCommand('');
    setNewColor('#3b82f6');
    setNewIcon('Save');
    setShowAddModal(false);
  };

  return (
    <div className="quick-actions-panel">
      <div className="panel-header">
        <h3 className="panel-title">Quick Admin Controls</h3>
        <button
          type="button"
          className="btn-add-action"
          onClick={() => setShowAddModal(true)}
        >
          <Icons.PlusIcon size={16} />
          <span>Add Custom Action</span>
        </button>
      </div>

      <div className="actions-grid">
        {quickActions.map((action) => {
          const isConfirming = confirmStopId === action.id;
          return (
            <div
              key={action.id}
              className={`action-card ${isConfirming ? 'confirm-mode' : ''}`}
              style={{
                borderColor: isConfirming ? 'var(--red)' : `${action.color}30`,
                background: isConfirming 
                  ? 'rgba(244, 63, 94, 0.1)' 
                  : `linear-gradient(135deg, rgba(15, 22, 42, 0.4) 0%, ${action.color}08 100%)`
              }}
            >
              {!isConfirming ? (
                <>
                  <button
                    type="button"
                    className="action-trigger"
                    onClick={() => handleActionClick(action)}
                  >
                    <div 
                      className="icon-wrapper" 
                      style={{ 
                        color: action.color, 
                        background: `${action.color}15` 
                      }}
                    >
                      {handleIcon(action.icon)}
                    </div>
                    <div className="action-details">
                      <span className="action-name">{action.name}</span>
                      <span className="action-command">/{action.command}</span>
                    </div>
                  </button>

                  {!isDefaultAction(action.id) && (
                    <button
                      type="button"
                      className="btn-delete-action"
                      onClick={() => onDeleteQuickAction(action.id)}
                      title="Delete action"
                    >
                      <Icons.TrashIcon size={14} />
                    </button>
                  )}
                </>
              ) : (
                <div className="confirm-container">
                  <span className="confirm-label">Are you sure?</span>
                  <div className="confirm-buttons">
                    <button
                      type="button"
                      className="btn-confirm-yes"
                      onClick={() => handleConfirmStop(action)}
                    >
                      Yes, stop
                    </button>
                    <button
                      type="button"
                      className="btn-confirm-no"
                      onClick={() => setConfirmStopId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3>Create Custom Quick Action</h3>
              <button 
                type="button"
                className="btn-close-modal"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="action-name">Action Name</label>
                <input
                  id="action-name"
                  type="text"
                  placeholder="e.g. Set Night"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="action-command">Minecraft Command</label>
                <div className="command-input-wrapper">
                  <span className="command-prefix">/</span>
                  <input
                    id="action-command"
                    type="text"
                    placeholder="time set night"
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Select Icon</label>
                <div className="icon-selector">
                  {ICONS_LIST.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      className={`icon-option ${newIcon === iconName ? 'selected' : ''}`}
                      onClick={() => setNewIcon(iconName)}
                    >
                      {handleIcon(iconName, 18)}
                      <span className="icon-label">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Select Color</label>
                <div className="color-selector">
                  {COLORS_LIST.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={`color-option ${newColor === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setNewColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
