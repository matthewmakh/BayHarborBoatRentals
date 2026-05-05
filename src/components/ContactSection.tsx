import { ContactCallbackForm } from "./ContactCallbackForm";

type Props = {
  phone: string;
  email: string;
  address: string;
};

export function ContactSection({ phone, email, address }: Props) {
  const tel = phone.replace(/\D/g, "");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return (
    <section id="contact" className="py-16">
      <div className="container-x grid gap-10 md:grid-cols-2 items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-navy-600">Contact</p>
          <h2 className="mt-2 text-3xl font-serif text-navy-800">Reach the harbor</h2>
          <p className="mt-3 text-navy-700/90 max-w-md">
            Questions about availability, group bookings, or special requests? Call us — we usually answer right away.
          </p>
          <div className="mt-6 space-y-3 text-navy-800">
            <div>
              <p className="text-sm uppercase tracking-wider text-navy-500">Phone</p>
              <a className="text-2xl font-semibold text-navy-700 hover:text-navy-600" href={`tel:${tel}`}>{phone}</a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-navy-500">Email</p>
              <a className="text-lg text-navy-700 hover:text-navy-600" href={`mailto:${email}`}>{email}</a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider text-navy-500">Address</p>
              <a className="text-lg text-navy-700 hover:text-navy-600" href={mapsUrl} target="_blank" rel="noopener noreferrer">{address}</a>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`tel:${tel}`} className="btn-primary">Call {phone}</a>
            <a href={`mailto:${email}`} className="btn-secondary">Email us</a>
          </div>
        </div>
        <div className="grid gap-6">
          <ContactCallbackForm />
          <div className="overflow-hidden rounded-2xl border border-navy-100 shadow-card">
            <iframe
              title="Map of Bay Harbor Boat Rentals"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
              className="h-[280px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
