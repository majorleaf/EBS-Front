import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, DollarSign, Users, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [numTickets, setNumTickets] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ✅ Fix #1: useRef to track redirect timeout — prevents state update on unmounted component
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Fix #2: loadEvent wrapped in useCallback with `id` as its dependency
  const loadEvent = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]); // ✅ dep array now satisfied

  // ✅ Fix #3: Clean up the redirect timer on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const closeModal = () => {
    if (!bookingSuccess) {
      setShowBookingModal(false);
      setBookingError('');
      setNumTickets(1);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!event) return;

    if (numTickets < 1 || numTickets > event.available_seats) {
      setBookingError(`Please select between 1 and ${event.available_seats} tickets`);
      return;
    }

    setBookingError('');
    setBookingLoading(true);

    try {
      const { error } = await supabase.from('bookings').insert({
        event_id: event.id,
        user_id: user.id,
        num_tickets: numTickets,
        total_price: event.price * numTickets,
        status: 'confirmed',
      });

      if (error) throw error;

      setBookingSuccess(true);

      // ✅ Fix #1 cont: Store timer ref so it can be cleared on unmount
      redirectTimerRef.current = setTimeout(() => {
        setShowBookingModal(false);
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setBookingError('Failed to book event. Please try again.');
      console.error('Error booking event:', error);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Event not found</p>
          <Button onClick={() => navigate('/events')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // ✅ Fix #4: Null-safe price display — guard against null event.price
  const price = event.price ?? 0;
  const formattedPrice = price === 0 ? 'Free' : `$${price.toFixed(2)}`;

  const isSoldOut = event.available_seats === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate('/events')} className="mb-6">
          ← Back to Events
        </Button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                {event.category}
              </span>
              {isSoldOut && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                  Sold Out
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-6">{event.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar size={24} className="text-blue-600" />
                <div>
                  <p className="font-medium">Date</p>
                  <p>{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Clock size={24} className="text-blue-600" />
                <div>
                  <p className="font-medium">Time</p>
                  <p>{formattedTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <MapPin size={24} className="text-blue-600" />
                <div>
                  <p className="font-medium">Location</p>
                  <p>{event.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <Users size={24} className="text-blue-600" />
                <div>
                  <p className="font-medium">Available Seats</p>
                  <p>
                    {event.available_seats} / {event.capacity}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-3xl font-bold text-gray-900">
                  <DollarSign size={32} className="text-blue-600" />
                  {formattedPrice}
                  {price > 0 && <span className="text-lg text-gray-600">per ticket</span>}
                </div>

                <Button
                  size="lg"
                  onClick={() => setShowBookingModal(true)}
                  disabled={isSoldOut}
                >
                  {isSoldOut ? 'Sold Out' : 'Book Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showBookingModal}
        onClose={closeModal}
        title="Book Event"
      >
        {bookingSuccess ? (
          <div className="text-center py-4">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600">Redirecting to your bookings...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-sm text-gray-600">
                {formattedDate} at {formattedTime}
              </p>
            </div>

            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {bookingError}
              </div>
            )}

            <Input
              type="number"
              label="Number of Tickets"
              min={1}
              max={event.available_seats}
              value={numTickets}
              onChange={(e) => setNumTickets(parseInt(e.target.value) || 1)}
            />

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Price per ticket:</span>
                <span className="font-medium">{formattedPrice}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>
                  {price === 0 ? 'Free' : `$${(price * numTickets).toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={closeModal}
                disabled={bookingLoading}
              >
                Cancel
              </Button>
              <Button fullWidth onClick={handleBooking} disabled={bookingLoading}>
                {bookingLoading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}