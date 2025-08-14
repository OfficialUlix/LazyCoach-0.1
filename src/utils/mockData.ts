import { Coach, Review } from '../types';

const reviews: Review[] = [
  { id: '1', userId: '1', userName: 'Alex Smith', rating: 5, comment: 'Amazing coach! Really helped me find direction.', date: '2025-01-01' },
  { id: '2', userId: '2', userName: 'Maria Garcia', rating: 4, comment: 'Great insights and practical advice.', date: '2025-01-05' },
  { id: '3', userId: '3', userName: 'John Doe', rating: 5, comment: 'Life-changing sessions. Highly recommend!', date: '2025-01-10' },
];

export const mockCoaches: Coach[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    specialty: 'Life & Career Coach',
    rating: 4.8,
    sessions: 150,
    price: 80,
    priceDisplay: '$80/hour',
    description: 'Specialized in career transitions and personal development with 8 years of experience helping professionals find their path.',
    location: 'New York, NY',
    experience: 8,
    languages: ['English', 'Spanish'],
    tags: ['Career Change', 'Leadership', 'Goal Setting', 'Work-Life Balance'],
    reviews: reviews.slice(0, 2),
    availability: [
      { id: '1-1', start: '09:00', end: '10:00', available: true, date: '2025-01-15' },
      { id: '1-2', start: '10:00', end: '11:00', available: true, date: '2025-01-15' },
      { id: '1-3', start: '14:00', end: '15:00', available: false, date: '2025-01-15' },
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    specialty: 'Business Coach',
    rating: 4.9,
    sessions: 200,
    price: 120,
    priceDisplay: '$120/hour',
    description: 'Expert in startup growth and leadership development. Former VP at tech companies, now helping entrepreneurs scale their businesses.',
    location: 'San Francisco, CA',
    experience: 12,
    languages: ['English', 'Mandarin'],
    tags: ['Startup Growth', 'Leadership', 'Strategic Planning', 'Team Building'],
    reviews: reviews.slice(1, 3),
    availability: [
      { id: '2-1', start: '08:00', end: '09:00', available: true, date: '2025-01-15' },
      { id: '2-2', start: '16:00', end: '17:00', available: true, date: '2025-01-15' },
    ]
  },
  {
    id: '3',
    name: 'Emily Davis',
    specialty: 'Wellness Coach',
    rating: 4.7,
    sessions: 120,
    price: 90,
    priceDisplay: '$90/hour',
    description: 'Focus on work-life balance and stress management. Certified in mindfulness and holistic wellness approaches.',
    location: 'Austin, TX',
    experience: 6,
    languages: ['English'],
    tags: ['Stress Management', 'Mindfulness', 'Work-Life Balance', 'Wellness'],
    reviews: [reviews[0]],
    availability: [
      { id: '3-1', start: '07:00', end: '08:00', available: true, date: '2025-01-15' },
      { id: '3-2', start: '18:00', end: '19:00', available: true, date: '2025-01-15' },
    ]
  },
  {
    id: '4',
    name: 'David Rodriguez',
    specialty: 'Executive Coach',
    rating: 4.9,
    sessions: 300,
    price: 150,
    priceDisplay: '$150/hour',
    description: 'Executive coaching for C-level leaders. Specializes in leadership transformation and organizational change.',
    location: 'Chicago, IL',
    experience: 15,
    languages: ['English', 'Spanish', 'French'],
    tags: ['Executive Leadership', 'Change Management', 'Team Performance', 'Strategic Vision'],
    reviews: reviews,
    availability: [
      { id: '4-1', start: '09:00', end: '10:00', available: true, date: '2025-01-15' },
      { id: '4-2', start: '15:00', end: '16:00', available: true, date: '2025-01-15' },
    ]
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    specialty: 'Relationship Coach',
    rating: 4.6,
    sessions: 80,
    price: 70,
    priceDisplay: '$70/hour',
    description: 'Helping individuals and couples build stronger, more fulfilling relationships through effective communication and understanding.',
    location: 'Los Angeles, CA',
    experience: 5,
    languages: ['English'],
    tags: ['Relationship Building', 'Communication', 'Conflict Resolution', 'Personal Growth'],
    reviews: reviews.slice(0, 1),
    availability: [
      { id: '5-1', start: '11:00', end: '12:00', available: true, date: '2025-01-15' },
      { id: '5-2', start: '17:00', end: '18:00', available: true, date: '2025-01-15' },
    ]
  }
];

export const getCoaches = (): Coach[] => mockCoaches;

export const getCoachById = (id: string): Coach | undefined => {
  return mockCoaches.find(coach => coach.id === id);
};

export const searchCoaches = (
  query: string,
  specialty?: string,
  priceRange?: [number, number],
  minRating?: number
): Coach[] => {
  return mockCoaches.filter(coach => {
    const matchesQuery = !query || 
      coach.name.toLowerCase().includes(query.toLowerCase()) ||
      coach.specialty.toLowerCase().includes(query.toLowerCase()) ||
      coach.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

    const matchesSpecialty = !specialty || coach.specialty.includes(specialty);
    
    const matchesPrice = !priceRange || 
      (coach.price >= priceRange[0] && coach.price <= priceRange[1]);
    
    const matchesRating = !minRating || coach.rating >= minRating;

    return matchesQuery && matchesSpecialty && matchesPrice && matchesRating;
  });
};