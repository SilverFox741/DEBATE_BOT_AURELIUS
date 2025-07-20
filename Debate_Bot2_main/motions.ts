// Sample debate motions database
import { DebateMotion } from './debate';

export const sampleMotions: DebateMotion[] = [
  {
    id: 'motion-1',
    motion: 'This House believes that social media platforms should be held legally responsible for the mental health impacts of their algorithms',
    context: 'Growing concerns about social media\'s impact on mental health, particularly among young people, have led to calls for greater platform accountability.',
    difficulty: 'intermediate',
    category: 'Technology & Society'
  },
  {
    id: 'motion-2',
    motion: 'This House would ban private ownership of assault weapons',
    context: 'Ongoing debates about gun control measures and public safety in various countries with different constitutional frameworks.',
    difficulty: 'advanced',
    category: 'Policy & Law'
  },
  {
    id: 'motion-3',
    motion: 'This House believes that schools should not teach subjects that some parents find objectionable',
    context: 'Tensions between parental rights, educational standards, and societal values in curriculum decisions.',
    difficulty: 'intermediate',
    category: 'Education'
  },
  {
    id: 'motion-4',
    motion: 'This House would implement a universal basic income',
    context: 'Economic discussions about automation, job displacement, and alternative approaches to social welfare.',
    difficulty: 'advanced',
    category: 'Economics'
  },
  {
    id: 'motion-5',
    motion: 'This House believes that zoos should be abolished',
    context: 'Ethical considerations about animal welfare, conservation efforts, and educational value of zoological institutions.',
    difficulty: 'beginner',
    category: 'Ethics & Environment'
  },
  {
    id: 'motion-6',
    motion: 'This House would require all citizens to vote',
    context: 'Democratic participation and the balance between civic duty and individual freedom in electoral systems.',
    difficulty: 'intermediate',
    category: 'Democracy & Governance'
  },
  {
    id: 'motion-7',
    motion: 'This House believes that artificial intelligence will do more harm than good',
    context: 'Rapid development of AI technology and its potential impacts on employment, privacy, and human autonomy.',
    difficulty: 'advanced',
    category: 'Technology & Future'
  },
  {
    id: 'motion-8',
    motion: 'This House would ban homework in primary schools',
    context: 'Educational research on the effectiveness of homework and its impact on children\'s wellbeing and family time.',
    difficulty: 'beginner',
    category: 'Education'
  }
];

// Standard debate roles configuration
export const debateRoles = [
  {
    id: 'pm',
    name: 'Prime Minister',
    side: 'government' as const,
    order: 1,
    timeLimit: 360, // 6 minutes in seconds
    description: 'Opens the debate for the government, defines the motion and presents the government case'
  },
  {
    id: 'lo',
    name: 'Leader of Opposition',
    side: 'opposition' as const,
    order: 2,
    timeLimit: 360,
    description: 'Responds to government case and presents the opposition case'
  },
  {
    id: 'dpm',
    name: 'Deputy Prime Minister',
    side: 'government' as const,
    order: 3,
    timeLimit: 360,
    description: 'Extends government case and responds to opposition arguments'
  },
  {
    id: 'do',
    name: 'Deputy Opposition',
    side: 'opposition' as const,
    order: 4,
    timeLimit: 360,
    description: 'Extends opposition case and responds to government arguments'
  },
  {
    id: 'gw',
    name: 'Government Whip',
    side: 'government' as const,
    order: 5,
    timeLimit: 360,
    description: 'Summarizes government case and responds to opposition'
  },
  {
    id: 'ow',
    name: 'Opposition Whip',
    side: 'opposition' as const,
    order: 6,
    timeLimit: 360,
    description: 'Summarizes opposition case and responds to government'
  },
  {
    id: 'gr',
    name: 'Government Reply',
    side: 'government' as const,
    order: 7,
    timeLimit: 240, // 4 minutes
    description: 'Final government summary, no new arguments allowed'
  },
  {
    id: 'or',
    name: 'Opposition Reply',
    side: 'opposition' as const,
    order: 8,
    timeLimit: 240,
    description: 'Final opposition summary, no new arguments allowed'
  }
];