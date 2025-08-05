"use client";

import { useState, useEffect } from "react";
import Menubar from "@/components/Menubar";
import { createClient } from "@/libs/supabase/client";

export default function Progress() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [monthlyProgress, setMonthlyProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadUserSettings(user.id);
        await loadMonthlyProgress(user.id);
      }
    };
    getUser();
  }, []);

  const loadUserSettings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserSettings(data);
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadMonthlyProgress = async (userId) => {
    try {
      // Primero asegurarse de que tenemos userSettings
      if (!userSettings) {
        await loadUserSettings(userId);
      }

      const currentYear = new Date().getFullYear();
      const months = [];
      
      for (let month = 0; month < 12; month++) {
        const startOfMonth = new Date(currentYear, month, 1);
        const endOfMonth = new Date(currentYear, month + 1, 0);
        const currentDate = new Date();
        
        // Si el mes aún no ha pasado, mostrar -0º
        if (startOfMonth > currentDate) {
          months.push({
            month: month + 1,
            monthName: startOfMonth.toLocaleDateString('es-ES', { month: 'long' }),
            degrees: -0,
            progress: 0,
            isFuture: true
          });
          continue;
        }

        // Obtener datos del mes - corregir la consulta
        const { data, error } = await supabase
          .from('corset_logs')
          .select('date, wore_it')
          .eq('user_id', userId)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0])
          .eq('wore_it', true);

        if (error) throw error;

        // Calcular grados mejorados (días usados * mejora estimada por día)
        const daysWorn = data?.length || 0;
        const improvementPerDay = (userSettings?.estimated_improvement_per_month || 1.0) / 30;
        const degreesImproved = daysWorn * improvementPerDay;
        
        // Calcular progreso (0.0º - 1.0º)
        const maxPossibleDays = endOfMonth.getDate();
        const progress = maxPossibleDays > 0 ? (daysWorn / maxPossibleDays) : 0;

        months.push({
          month: month + 1,
          monthName: startOfMonth.toLocaleDateString('es-ES', { month: 'long' }),
          degrees: degreesImproved,
          progress: Math.round(progress * 10) / 10,
          isFuture: false
        });
      }

      setMonthlyProgress(months);
    } catch (error) {
      console.error('Error loading monthly progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalImprovement = () => {
    if (!monthlyProgress.length) return 0;
    return monthlyProgress.reduce((total, month) => total + month.degrees, 0);
  };

  const calculateCurrentDegrees = () => {
    if (!userSettings) return 0;
    const totalImprovement = calculateTotalImprovement();
    return Math.max(0, userSettings.initial_degrees - totalImprovement);
  };

  const renderSpineLine = (degrees, isCurrent = false) => {
    const segments = 20; // Número de segmentos en la línea
    const maxDegrees = 50; // Grados máximos para la visualización
    const normalizedDegrees = Math.min(degrees, maxDegrees);
    const curveIntensity = (normalizedDegrees / maxDegrees) * 100;
    
    return (
      <div className="relative w-full h-8 flex items-center">
        <svg className="w-full h-full" viewBox="0 0 200 30">
          <path
            d={`M 10 15 Q 100 ${15 - curveIntensity * 0.3} 190 15`}
            stroke={isCurrent ? "#3b82f6" : "#6b7280"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute right-0 top-0 text-xs font-medium">
          {degrees.toFixed(1)}º
        </div>
      </div>
    );
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
        
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)] mt-8 mb-4">
          {/* Columna izquierda: Progreso mensual */}
          <div className="bg-base-200 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <h2 className="text-xl font-bold mb-4">Progreso Mensual</h2>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-base-300">
              <div className="flex flex-col justify-between h-full">
                {monthlyProgress.map((month) => (
                  <div key={month.month} className="space-y-1 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <span className="font-medium capitalize text-sm">{month.monthName}</span>
                      <span className={`font-bold text-sm ${month.isFuture ? 'text-gray-400' : 'text-primary'}`}>
                        {month.isFuture ? '-0.00º' : `${month.degrees.toFixed(2)}º`}
                      </span>
                    </div>
                    <div className="w-full bg-base-content/20 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          month.isFuture ? 'bg-gray-400' : 'bg-primary'
                        }`}
                        style={{ width: `${month.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna central: Tu escoliosis */}
          <div className="bg-base-200 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <h2 className="text-2xl font-bold text-center mb-6">Tu Escoliosis</h2>
            
            {/* Número grande arriba */}
            <div className="text-center mb-8">
              <div className="text-7xl font-bold text-primary mb-2">
                {calculateCurrentDegrees().toFixed(1)}º
              </div>
              <div className="text-sm text-base-content/70">
                {userSettings?.initial_degrees}º - {calculateTotalImprovement().toFixed(1)}º = {calculateCurrentDegrees().toFixed(1)}º
              </div>
            </div>

                         {/* Líneas de la espalda en horizontal */}
             <div className="flex-1 flex flex-row items-center justify-center space-x-16">
               <div className="flex flex-col items-center space-y-3">
                 <div className="text-sm font-medium text-gray-500">Estado inicial</div>
                 <div className="text-sm font-medium text-gray-500">{userSettings?.initial_degrees || 0}º</div>
                 <div className="relative w-32 h-48">
                   <svg className="w-full h-full" viewBox="0 0 128 192">
                     <path
                       d={`M 64 10 Q ${64 + (userSettings?.initial_degrees || 0) * 1.2} 128 64 182`}
                       stroke="#6b7280"
                       strokeWidth="4"
                       fill="none"
                       strokeLinecap="round"
                       opacity="0.7"
                     />
                   </svg>
                 </div>
               </div>
               
               <div className="flex flex-col items-center space-y-3">
                 <div className="text-sm font-medium text-blue-500">Estado actual</div>
                 <div className="text-sm font-medium text-blue-500">{calculateCurrentDegrees().toFixed(1)}º</div>
                 <div className="relative w-32 h-48">
                   <svg className="w-full h-full" viewBox="0 0 128 192">
                     <path
                       d={`M 64 10 Q ${64 + calculateCurrentDegrees() * 1.2} 128 64 182`}
                       stroke="#3b82f6"
                       strokeWidth="4"
                       fill="none"
                       strokeLinecap="round"
                     />
                   </svg>
                 </div>
               </div>
             </div>
          </div>

          {/* Columna derecha: Grados acumulados */}
          <div className="bg-base-200 p-6 rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <h2 className="text-xl font-bold mb-6">Grados Mejorados</h2>
            
                         <div className="flex-1 flex flex-col justify-evenly">
               {/* Total acumulado */}
               <div className="text-center">
                 <div className="text-8xl font-bold text-green-500 mb-2">
                   {calculateTotalImprovement().toFixed(1)}º
                 </div>
                 <div className="text-sm text-base-content/70">
                   Total acumulado
                 </div>
               </div>

               {/* Promedio mensual */}
               <div className="text-center">
                 <div className="text-6xl font-bold text-blue-500 mb-2">
                   {(calculateTotalImprovement() / 12).toFixed(1)}º
                 </div>
                 <div className="text-sm text-base-content/70">
                   Promedio mensual
                 </div>
               </div>

               {/* Mejor mes */}
               <div className="text-center">
                 <div className="text-5xl font-bold text-orange-500 mb-2">
                   {Math.max(...monthlyProgress.map(m => m.degrees)).toFixed(1)}º
                 </div>
                 <div className="text-sm text-base-content/70">
                   Mejor mes
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>
    </main>
  );
}
