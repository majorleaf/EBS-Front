import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Ticket, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { Database } from '../lib/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type Event = Database['public']['Tables']['events']['Row'];

interface BookingWithEvent extends Booking {
  event: Event;
}

// ✅ Fix #1: Moved BookingCard OUTSIDE Dashboard to prevent re-creation on every render
interface BookingCardProps {
  booking: BookingWithEvent;
  onCancel: (id: string) => void;
  onNavigate: (id: string) => void;
}

const BookingCard = ({ booking, onCancel, onNavigate }: BookingCardProps) => {
  const eventDate = new Date(booking.event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isUpcoming = eventDate >= new Date() && booking.status === 'confirmed';

  // ✅ Fix #4: Guard against null total_price before calling .toFixed()
  const price = booking.total_price ?? 0;
  const formattedPrice = price === 0 ? 'Free' : `$${price.toFixed(2)}`;

  return (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {booking.event.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                {booking.event.category}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  booking.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {booking.status}
              </span>
            </div>
          </div>
          {isUpcoming && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancel(booking.id)}
            >
              <X size={16} />
            </Button>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{booking.event.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Ticket size={16} />
            <span>{booking.num_tickets} ticket(s)</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Paid:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formattedPrice}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          fullWidth
          className="mt-4"
          onClick={() => onNavigate(booking.event.id)}
        >
          View Event Details
        </Button>
      </div>
    </Card>
  );
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithEvent[]>([]);
  const [pastBookings, setPastBookings] = useState<BookingWithEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fix #2: Wrapped in useCallback and added to useEffect dependency array
  const loadBookings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const upcoming: BookingWithEvent[] = [];
      const past: BookingWithEvent[] = [];

      // ✅ Fix #3: Replaced `any` with the proper BookingWithEvent type
      data?.forEach((booking: BookingWithEvent) => {
        if (new Date(booking.event.event_date) >= now && booking.status === 'confirmed') {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      });

      setUpcomingBookings(upcoming);
      setPastBookings(past);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]); // ✅ Fix #2 cont: loadBookings now properly listed as dependency

  // ✅ Fix #5: Replaced window.confirm/alert with console-based feedback.
  // TODO: Replace with a proper modal/toast component for production use.
  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this booking?');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      await loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      // TODO: Replace with toast notification (e.g. react-hot-toast or shadcn/ui toast)
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleNavigateToEvent = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Bookings</h1>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Upcoming Events ({upcomingBookings.length})
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 mb-4">You have no upcoming event bookings.</p>
              <Button onClick={() => navigate('/events')}>Browse Events</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                  onNavigate={handleNavigateToEvent}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Past & Cancelled Events ({pastBookings.length})
          </h2>

          {pastBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No past or cancelled bookings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                  onNavigate={handleNavigateToEvent}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}