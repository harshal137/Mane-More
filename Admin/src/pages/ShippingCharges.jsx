import { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaSave, FaShippingFast } from "react-icons/fa";
import { userRequest } from "../requestMethods";

const ShippingCharges = () => {
  const [charges, setCharges] = useState({ withinLondon: "", outsideLondon: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCharges = async () => {
      try {
        const { data } = await userRequest.get("/shipping");
        setCharges({
          withinLondon: data.withinLondon,
          outsideLondon: data.outsideLondon,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load shipping charges.");
      } finally {
        setLoading(false);
      }
    };

    loadCharges();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const { data } = await userRequest.put("/shipping", {
        withinLondon: Number(charges.withinLondon),
        outsideLondon: Number(charges.outsideLondon),
      });
      setCharges({
        withinLondon: data.withinLondon,
        outsideLondon: data.outsideLondon,
      });
      setMessage("Shipping charges updated. New checkout orders will use these rates.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update shipping charges.");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { name: "withinLondon", label: "Within London", help: "Charge for deliveries inside London" },
    { name: "outsideLondon", label: "Outside London", help: "Charge for deliveries outside London" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shipping Charges</h1>
            <p className="mt-2 text-slate-500">Set the delivery rates displayed and charged at checkout.</p>
          </div>
          <div className="rounded-2xl bg-violet-100 px-4 py-3 text-violet-700">
            <FaShippingFast className="text-2xl" />
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-2xl border p-4 ${message ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
            {message || error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Loading shipping charges...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
              <div key={field.name} className="rounded-2xl border border-slate-200 p-5">
                <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor={field.name}>
                  {field.label}
                </label>
                <p className="mb-3 text-sm text-slate-500">{field.help}</p>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-500" />
                  <span className="absolute left-11 top-1/2 -translate-y-1/2 font-semibold text-slate-600">$</span>
                  <input
                    id={field.name}
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={charges[field.name]}
                    onChange={(event) => setCharges((current) => ({ ...current, [field.name]: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-16 pr-4 text-slate-900 outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaSave />
              {saving ? "Saving..." : "Save Shipping Charges"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ShippingCharges;
