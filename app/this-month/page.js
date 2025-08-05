"use client";

import { useState, useEffect } from "react";
import Menubar from "@/components/Menubar";
import { createClient } from "@/libs/supabase/client";
import { Flame, Trophy, Zap } from "lucide-react";


export default function ThisMonth() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [monthData, setMonthData] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadMonthData(user.id);
        calculateStreak(user.id);
      }
    };
    getUser();
  }, [supabase]);

  const loadMonthData = async (userId) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('corset_logs')
        .select('date, wore_it')
        .eq('user_id', userId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date');

      if (error) throw error;

      // Crear array de días del mes
      const daysInMonth = endOfMonth.getDate();
      const monthArray = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = data?.find(d => d.date === dateStr);
        monthArray.push({
          day,
          woreIt: dayData?.wore_it || false,
          hasData: !!dayData
        });
      }

      setMonthData(monthArray);
      
      // Calcular porcentaje basado en días registrados vs días del mes
      const daysWorn = data?.filter(d => d.wore_it).length || 0;
      const totalDaysInMonth = daysInMonth;
      setPercentage(totalDaysInMonth > 0 ? Math.round((daysWorn / totalDaysInMonth) * 100) : 0);
      
    } catch (error) {
      console.error('Error loading month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('corset_logs')
        .select('date, wore_it')
        .eq('user_id', userId)
        .eq('wore_it', true)
        .order('date', { ascending: false });

      if (error) throw error;

      let streak = 0;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (let i = 0; i < data.length; i++) {
        const logDate = new Date(data[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);

        if (logDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      setCurrentStreak(streak);
    } catch (error) {
      console.error('Error calculating streak:', error);
    }
  };

  const getNextLevelDays = () => {
    // Niveles de racha: 3, 7, 14, 30, 60, 100 días
    const levels = [3, 7, 14, 30, 60, 100];
    const nextLevel = levels.find(level => level > currentStreak) || 100;
    return nextLevel;
  };

  const getProgressPercentage = () => {
    const nextLevel = getNextLevelDays();
    const previousLevel = [3, 7, 14, 30, 60, 100].reverse().find(level => level <= currentStreak) || 0;
    const progress = ((currentStreak - previousLevel) / (nextLevel - previousLevel)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getCurrentLevelIcon = () => {
    if (currentStreak >= 100) return "💎";
    if (currentStreak >= 60) return "👑";
    if (currentStreak >= 30) return "🏆";
    if (currentStreak >= 14) return "🥇";
    if (currentStreak >= 7) return "⭐";
    if (currentStreak >= 3) return "🔥";
    if (currentStreak >= 1) return "flame-off";
    return "flame-off";
  };

  const getNextLevelIcon = () => {
    const nextLevel = getNextLevelDays();
    if (nextLevel === 3) return "🔥";
    if (nextLevel === 7) return "⭐";
    if (nextLevel === 14) return "🥇";
    if (nextLevel === 30) return "🏆";
    if (nextLevel === 60) return "👑";
    if (nextLevel === 100) return "💎";
    return "💎";
  };

  if (loading) {
    return (
      <main className="min-h-screen p-2 pb-24">
        <section className="max-w-7xl mx-auto space-y-8">
          <Menubar />
          <div className="flex justify-center items-center min-h-[60vh]">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen p-2">
      <section className="h-full max-w-7xl mx-auto">
        <Menubar />
        
                 <div className="flex flex-col gap-4 items-center justify-center h-[calc(100vh-120px)] mt-4">
           {/* Fila superior: Calendario y Gráfica */}
           <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl">
             {/* Calendario del mes */}
             <div className="bg-base-200 p-6 rounded-xl shadow-lg w-full max-w-md">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold">Este mes</h2>
                 <span className="text-lg font-medium text-primary">
                   {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                 </span>
               </div>
               <div className="grid grid-cols-7 gap-2">
                 {monthData.map((dayData, index) => (
                   <div
                     key={index}
                     className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                       dayData.woreIt
                         ? 'bg-green-500 text-white shadow-lg'
                         : dayData.hasData
                         ? 'bg-red-500 text-white shadow-lg'
                         : 'bg-transparent border-2 border-base-content/20 text-base-content/50'
                     }`}
                   >
                     {dayData.day}
                   </div>
                 ))}
               </div>
             </div>

             {/* Gráfica circular de porcentaje */}
             <div className="bg-base-200 p-6 rounded-xl shadow-lg w-full max-w-lg flex items-center justify-center">
               <div className="flex flex-col items-center">
                 <div className="relative w-64 h-64">
                   <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 36 36">
                     <path
                       className="text-base-content/20"
                       stroke="currentColor"
                       strokeWidth="4"
                       fill="none"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     />
                     <path
                       className="text-primary"
                       stroke="currentColor"
                       strokeWidth="4"
                       strokeDasharray={`${percentage}, 100`}
                       strokeLinecap="round"
                       fill="none"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                     />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-5xl font-bold text-white">{percentage}%</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Fila inferior: Racha y barra de progreso */}
           <div className="bg-base-200 p-6 rounded-xl shadow-lg w-full max-w-4xl">
             <div className="flex items-center justify-center gap-3 mb-6">
               {getCurrentLevelIcon() === "flame-off" ? (
                 <Flame className="w-16 h-16 text-gray-400" />
               ) : (
                 <span className="text-5xl">{getCurrentLevelIcon()}</span>
               )}
               <span className="text-5xl font-bold text-white">{currentStreak}</span>
             </div>

             {/* Barra de progreso de racha */}
             <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-1">
                   {getCurrentLevelIcon() === "flame-off" ? (
                     <Flame className="w-4 h-4 text-gray-400" />
                   ) : (
                     <span className="text-orange-500">{getCurrentLevelIcon()}</span>
                   )}
                   <span className="text-white">{currentStreak} días</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <span className="text-orange-500">{getNextLevelIcon()}</span>
                   <span className="text-white">{getNextLevelDays()} días</span>
                 </div>
               </div>
               <div className="w-full bg-base-content/20 rounded-full h-2">
                 <div 
                   className="bg-primary h-2 rounded-full transition-all duration-500"
                   style={{ width: `${getProgressPercentage()}%` }}
                 ></div>
               </div>
               {/* Información de niveles de racha */}
               <div className="flex justify-between items-center text-xs text-base-content/70 mt-2">
                 <span>🔥 3 días: Iniciando</span>
                 <span>⭐ 7 días: Constante</span>
                 <span>🥇 14 días: Dedicado</span>
                 <span>🏆 30 días: Experto</span>
                 <span>👑 60 días: Maestro</span>
                 <span>💎 100 días: Leyenda</span>
               </div>
             </div>
           </div>
         </div>
      </section>
    </main>
  );
}
