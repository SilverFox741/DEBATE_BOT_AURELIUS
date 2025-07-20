// Component for selecting debate motions
import { useState } from 'react';
import { Search, Plus, Target, TrendingUp, BookOpen } from 'lucide-react';
import { DebateMotion } from './debate';
import { sampleMotions } from './motions';

interface MotionSelectorProps {
  onMotionSelect: (motion: DebateMotion) => void;
}

export function MotionSelector({ onMotionSelect }: MotionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customMotion, setCustomMotion] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const categories = ['all', ...Array.from(new Set(sampleMotions.map(m => m.category)))];

  const filteredMotions = sampleMotions.filter(motion => {
    const matchesSearch = motion.motion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motion.context.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || motion.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCustomSubmit = () => {
    if (!customMotion.trim()) return;
    
    const newMotion: DebateMotion = {
      id: `custom-${Date.now()}`,
      motion: customMotion.trim(),
      context: 'Custom debate motion created by user.',
      difficulty: 'intermediate',
      category: 'Custom'
    };
    
    onMotionSelect(newMotion);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Select Debate Motion</h2>
        </div>
        
        <p className="text-gray-600 mb-6">
          Choose from our curated collection of debate motions or create your own. Each motion is designed to challenge your critical thinking and argumentation skills.
        </p>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search motions by topic or context..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'All Categories' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Custom Motion Form */}
        {showCustomForm && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Create Custom Motion</h3>
            <div className="space-y-3">
              <textarea
                value={customMotion}
                onChange={(e) => setCustomMotion(e.target.value)}
                placeholder="Enter your debate motion here..."
                className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customMotion.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Use This Motion
                </button>
                <button
                  onClick={() => {
                    setShowCustomForm(false);
                    setCustomMotion('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Motion List */}
        <div className="space-y-4">
          {!showCustomForm && (
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Create Custom Motion</span>
              </div>
            </button>
          )}

          {filteredMotions.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No motions found</h3>
              <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredMotions.map((motion) => (
              <button
                key={motion.id}
                onClick={() => onMotionSelect(motion)}
                className="w-full p-6 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 flex-1 mr-4">{motion.motion}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(motion.difficulty)}`}>
                    {motion.difficulty}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{motion.context}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {motion.category}
                  </span>
                  <span>Click to select</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}