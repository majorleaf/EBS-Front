import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Lock, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Signature element: a tiny looping animation of the exact thing this app is
// built to solve — two people racing for the same seat, and the lock/checkout
// flow resolving it safely. This is the one real, non-generic thing on the
// page, so everything else stays quiet around it.
function SeatRaceDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);

  const steps = [
    { label: 'Two people tap the same seat', a: 'idle', b: 'idle' },
    { label: 'First request locks it for 10 minutes', a: 'locked', b: 'idle' },
    { label: 'Second request is turned away — seat unavailable', a: 'locked', b: 'blocked' },
    { label: 'First payment succeeds, seat confirmed', a: 'confirmed', b: 'blocked' },
  ];

  const current = steps[step];

  const seatStyle = (state: string) => {
    if (state === 'confirmed') return 'bg-blue-600 border-blue-600 text-white';
    if (state === 'locked') return 'bg-amber-50 border-amber-400 text-amber-700';
    if (state === 'blocked') return 'bg-red-50 border-red-300 text-red-500';
    return 'bg-white border-gray-300 text-gray-400';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 w-full max-w-md">
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="text-center">
          <div
            className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center mx-auto mb-2 transition-colors duration-500 ${seatStyle(
              current.a
            )}`}
          >
            {current.a === 'confirmed' ? <CheckCircle2 size={22} /> : current.a === 'locked' ? <Lock size={18} /> : 'A2'}
          </div>
          <p className="text-xs text-gray-500">User A</p>
        </div>
        <div className="text-center">
          <div
            className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center mx-auto mb-2 transition-colors duration-500 ${seatStyle(
              current.b
            )}`}
          >
            {current.b === 'blocked' ? '×' : 'A2'}
          </div>
          <p className="text-xs text-gray-500">User B</p>
        </div>
      </div>
      <p className="text-sm text-gray-700 text-center min-h-[2.5rem] flex items-center justify-center">{current.label}</p>
      <div className="flex justify-center gap-1.5 mt-4">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
}

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Book the seat you actually get.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            EventBook holds your seat the moment you start checkout, so no one else can take it while you pay —
            even if two people click at the exact same second.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/events')}>
              Browse events
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')}>
              Create an account
            </Button>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <SeatRaceDemo />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-10 text-center">How a booking stays yours</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <Lock size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hold your seat</h3>
              <p className="text-sm text-gray-600">
                Starting checkout locks your seat for 10 minutes, so it's reserved while you complete payment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pay with confidence</h3>
              <p className="text-sm text-gray-600">
                Payment only goes through once your hold is confirmed still valid — never charged for a seat that's gone.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get your ticket</h3>
              <p className="text-sm text-gray-600">
                Your booking is confirmed instantly and shows up in My Bookings, ready whenever you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple closing CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
          <Calendar size={16} />
          <span>Music · Sports · Technology · Business · Arts · Education</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Find something happening near you</h2>
        <Button size="lg" onClick={() => navigate('/events')}>
          <MapPin size={16} className="mr-2 inline" />
          Browse events
        </Button>
      </section>
    </div>
  );
}


