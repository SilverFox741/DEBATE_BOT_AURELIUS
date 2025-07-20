// Component for configuring debate parameters
import { useState } from 'react';
import { Users, Settings, Target } from 'lucide-react';
import { DebateMotion, DebateRole } from './debate';
import { debateRoles } from './motions';

interface DebateSetupProps {
  motion: DebateMotion;
  onSetupComplete: (
    humanSide: 'government' | 'opposition',
    humanRole: DebateRole,
    aiSkillLevel: 'beginner' | 'intermediate' | 'advanced'
  ) => void;
  onBack: () => void;
}

export function DebateSetup({ motion, onSetupComplete, onBack }: DebateSetupProps) {
  const [humanSide, setHumanSide] = useState<'government' | 'opposition'>('government');
  const [humanRoleId, setHumanRoleId] = useState<string>('pm');
  const [aiSkillLevel, setAiSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const availableRoles = debateRoles.filter(role => role.side === humanSide);
  const selectedRole = debateRoles.find(role => role.id === humanRoleId);

  const handleSubmit = () => {
    if (!selectedRole) return;
    onSetupComplete(humanSide, selectedRole, aiSkillLevel);
  };

  const getSkillDescription = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Basic arguments, simple language, some logical gaps';
      case 'intermediate':
        return 'Solid arguments, good structure, moderate sophistication';
      case 'advanced':
        return 'Complex arguments, sophisticated rhetoric, exceptional logic';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Debate Setup</h2>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Selected Motion:</h3>
          <p className="text-gray-700">{motion.motion}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Side Selection */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-3">
            <Target className="w-5 h-5" />
            Choose Your Side
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setHumanSide('government');
                setHumanRoleId('pm'); // Reset to first role of government
              }}
              className={`p-4 border rounded-lg text-left transition-all ${humanSide === 'government' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-medium text-gray-900">Government</div>
              <div className="text-sm text-gray-600 mt-1">
                Support the motion and prove it should be implemented
              </div>
            </button>
            <button
              onClick={() => {
                setHumanSide('opposition');
                setHumanRoleId('lo'); // Reset to first role of opposition
              }}
              className={`p-4 border rounded-lg text-left transition-all ${humanSide === 'opposition' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-medium text-gray-900">Opposition</div>
              <div className="text-sm text-gray-600 mt-1">
                Oppose the motion and prove it should not be implemented
              </div>
            </button>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-3">
            <Users className="w-5 h-5" />
            Select Your Role
          </h3>
          <div className="space-y-2">
            {availableRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => setHumanRoleId(role.id)}
                className={`w-full p-4 border rounded-lg text-left transition-all ${humanRoleId === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{role.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{role.description}</div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {Math.floor(role.timeLimit / 60)}:{(role.timeLimit % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Skill Level */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">AI Opponent Skill Level</h3>
          <div className="space-y-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setAiSkillLevel(level)}
                className={`w-full p-4 border rounded-lg text-left transition-all ${aiSkillLevel === level ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="font-medium text-gray-900 capitalize">{level}</div>
                <div className="text-sm text-gray-600 mt-1">{getSkillDescription(level)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Motion
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Debate
          </button>
        </div>
      </div>
    </div>
  );
}