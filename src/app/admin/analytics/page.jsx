"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

const CustomTooltip = ({ active, payload, timeframe }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border-2 border-[#ffc107]/60 rounded-[1.5rem] p-3 px-4 shadow-2xl relative mb-10 -translate-x-1/2 min-w-[160px] text-center">
                <p className="text-2xl font-extrabold text-black leading-tight">
                    {payload[0].value.toLocaleString()}
                </p>
                <p className="text-base font-medium text-gray-400 mt-1">
                    {payload[0].payload.fullDate}
                </p>
                {/* Pointer Arrow */}
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-white border-r-2 border-b-2 border-[#ffc107]/60 rotate-45"></div>
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("7"); // "7", "30", "all"
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = React.useRef(null);
    const supabase = createClient();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let query = supabase.from('users').select('created_at');
                
                if (timeframe !== 'all') {
                    const days = parseInt(timeframe);
                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - (days - 1));
                    startDate.setHours(0, 0, 0, 0);
                    query = query.gte('created_at', startDate.toISOString());
                }

                const { data: users, error } = await query;
                if (error) throw error;

                const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                let processedData = [];

                if (timeframe === '7' || timeframe === '30') {
                    const daysCount = parseInt(timeframe);
                    const days = [];
                    for (let i = 0; i < daysCount; i++) {
                        const date = new Date();
                        date.setDate(date.getDate() - (daysCount - 1 - i));
                        const dateStr = date.toISOString().split('T')[0];
                        days.push({
                            date: dateStr,
                            name: timeframe === '7' ? dayLabels[date.getDay()] : `${date.getDate()} ${monthLabels[date.getMonth()].slice(0, 3)}`,
                            fullDate: `${dayLabels[date.getDay()]} ${date.getDate()}, ${monthLabels[date.getMonth()]}`,
                            value: 0
                        });
                    }

                    users.forEach(user => {
                        const userDate = user.created_at.split('T')[0];
                        const day = days.find(d => d.date === userDate);
                        if (day) day.value++;
                    });
                    processedData = days;
                } else {
                    // All Time - Group by Month
                    const months = {};
                    users.forEach(user => {
                        const date = new Date(user.created_at);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        if (!months[monthKey]) {
                            months[monthKey] = {
                                name: monthLabels[date.getMonth()],
                                fullDate: `${monthLabels[date.getMonth()]} ${date.getFullYear()}`,
                                value: 0,
                                sortKey: monthKey
                            };
                        }
                        months[monthKey].value++;
                    });
                    processedData = Object.values(months).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
                }

                setData(processedData);
            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [supabase, timeframe]);

    const timeframeLabel = timeframe === '7' ? 'Last 7 Days' : timeframe === '30' ? 'Last 30 Days' : 'All Time';

    const maxVal = Math.max(...data.map(d => d.value), 5);
    const roundedMax = Math.ceil(maxVal / 5) * 5;
    const yTicks = [0, Math.floor(roundedMax * 0.25), Math.floor(roundedMax * 0.5), Math.floor(roundedMax * 0.75), roundedMax];

    return (
        <div className="h-full flex flex-col pb-1 animate-in fade-in duration-500">
            {/* Chart Container */}
            <div className="bg-white rounded-[2.5rem] shadow-sm p-12 relative overflow-visible flex-1 flex flex-col min-h-0">
                <div className="flex justify-end mb-10 shrink-0 relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all"
                    >
                        <span className="text-lg font-extrabold text-gray-800">{timeframeLabel}</span>
                        <HugeiconsIcon icon={ArrowDown01Icon} className={`w-5 h-5 text-gray-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {[
                                { label: 'Last 7 Days', value: '7' },
                                { label: 'Last 30 Days', value: '30' },
                                { label: 'All Time', value: 'all' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setTimeframe(option.value);
                                        setShowDropdown(false);
                                    }}
                                    className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${timeframe === option.value ? 'bg-[#ffc107]/10 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 w-full mt-4 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 60, right: 80, left: 20, bottom: 20 }}
                        >
                            <defs>
                                <filter id="shadow" height="200%">
                                    <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
                                    <feOffset in="blur" dx="0" dy="10" result="offsetBlur" />
                                    <feFlood floodColor="#ffc107" floodOpacity="0.2" result="offsetColor" />
                                    <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow" />
                                    <feMerge>
                                        <feMergeNode />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            
                            <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="0" />
                            
                            <XAxis 
                                dataKey="name" 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: timeframe === '30' ? 12 : 18, fontWeight: 500 }}
                                dy={20}
                                interval={timeframe === '30' ? 4 : 0}
                            />
                            
                            <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 18, fontWeight: 500 }}
                                tickFormatter={(value) => value.toString()}
                                dx={-20}
                                domain={[0, roundedMax]}
                                ticks={yTicks}
                            />
                            
                            <Tooltip 
                                content={<CustomTooltip timeframe={timeframe} />} 
                                cursor={{ stroke: '#ffc107', strokeWidth: 2 }}
                                position={{ y: -60 }}
                                allowEscapeViewBox={{ x: true, y: true }}
                            />
                            
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#ffc107"
                                strokeWidth={4}
                                dot={timeframe === '30' ? false : { fill: '#fff', stroke: '#ffc107', strokeWidth: 3, r: 8 }}
                                activeDot={{ fill: '#fff', stroke: '#ffc107', strokeWidth: 4, r: 10 }}
                                animationDuration={1500}
                                filter="url(#shadow)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}