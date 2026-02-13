// src/components/StatCard.tsx
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  trend: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color, trend }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${color} mb-2`}>{value}</h3>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {trend}
      </p>
    </div>
  );
};

export default StatCard;