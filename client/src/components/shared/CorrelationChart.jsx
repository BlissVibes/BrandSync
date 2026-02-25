import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

export default function CorrelationChart({ clientData = [], brandData = [], clientName, brandName, months }) {
  // Merge into combined dataset
  const combined = (months || clientData.map(d => d.month)).map((month, i) => ({
    month: month ? month.slice(0, 7) : `M${i + 1}`,
    client: clientData[i]?.value ?? null,
    brand: brandData[i]?.value ?? null,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={combined} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          tickLine={false}
          tickFormatter={(v) => v.slice(2)}
          interval={3}
        />
        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} width={28} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(128,128,128,0.2)' }}
          formatter={(val, name) => [val?.toFixed(0), name === 'client' ? clientName : brandName]}
        />
        <Legend formatter={(val) => val === 'client' ? clientName || 'Client' : brandName || 'Brand'} />
        <Line type="monotone" dataKey="client" stroke="#2563eb" strokeWidth={2} dot={false} name="client" />
        <Line type="monotone" dataKey="brand" stroke="#f59e0b" strokeWidth={2} dot={false} name="brand" strokeDasharray="5 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}
