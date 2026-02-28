import { Calendar, MapPin, DollarSign, Users } from 'lucide-react';
import { Card } from "../components/ui/Card.tsx"
import type { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const eventDate = new Date(event.event_date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Card hoverable onClick={onClick}>
      {event.image_url && (
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            {event.category}
          </span>
          {event.available_seats === 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
              Sold Out
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>
              {event.available_seats} / {event.capacity} seats available
            </span>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign size={16} />
            <span className="font-semibold text-gray-900">
              {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
