import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EventCard } from '../components/EventCard';
import { Input } from '../components/ui/Input';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

const categories = ['All', 'Music', 'Sports', 'Technology', 'Business', 'Arts', 'Education'];

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const navigate = useNavigate();

  // ✅ Fix #1: loadEvents wrapped in useCallback and added to useEffect dep array
  const loadEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }, []); // no external deps — safe as empty array

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ✅ Fix #2: filterEvents inlined directly into useEffect — no need for useCallback
  // This eliminates the ESLint warning entirely. All deps are primitive values or stable state,
  // so they can be listed directly without risk of infinite loops.
  useEffect(() => {
    let filtered = events;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((event) => event.category === selectedCategory);
    }

    if (priceFilter === 'free') {
      filtered = filtered.filter((event) => event.price === 0);
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter((event) => event.price > 0);
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedCategory, priceFilter]); // ✅ all deps accounted for, no warning

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Discover Events</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search events by title, description, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPriceFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  priceFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Prices
              </button>
              <button
                onClick={() => setPriceFilter('free')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  priceFilter === 'free'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setPriceFilter('paid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  priceFilter === 'paid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/events/${event.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}