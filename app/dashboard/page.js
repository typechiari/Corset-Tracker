"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Menubar from "@/components/Menubar";
import { createClient } from "@/libs/supabase/client";
import { X, Check } from "lucide-react";

export default function Dashboard() {
  const supabase = createClient();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [user, setUser] = useState(null);
  const [userSettings, setUserSettings] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Verificar configuración antes de cargar datos
        await checkUserConfiguration(user.id);
        loadTodayLog(user.id);
      }
    };
    getUser();
  }, [supabase]);

  const checkUserConfiguration = async (userId) => {
    try {
      const { data: userSettings, error } = await supabase
        .from('user_settings')
        .select('initial_degrees, estimated_improvement_per_month, goal_hours_per_day')
        .eq('user_id', userId)
        .single();

      // Si no hay configuración o faltan datos esenciales, redirigir a config-scoliosis
      if (!userSettings || !userSettings.initial_degrees) {
        router.push('/dashboard/config-scoliosis');
        return;
      }

      // Guardar los settings en el estado
      setUserSettings(userSettings);
    } catch (error) {
      // Si hay error (probablemente no existe configuración), redirigir
      router.push('/dashboard/config-scoliosis');
    }
  };

  const loadTodayLog = async (userId) => {
    try {
      const today = new Date().toLocaleDateString('sv-SE'); // formato 'YYYY-MM-DD'
      


      const { data, error } = await supabase
        .from('corset_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading today log:', error);
      } else {
        setTodayLog(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    const now = new Date();
    console.log('Hora local:', now.toLocaleString('es-ES')); // ej: "19:30:45"


  };

  const handleLogCorset = async (woreIt) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const today = new Date().toLocaleDateString('sv-SE'); // formato 'YYYY-MM-DD'
      
      if (todayLog) {
        // Update existing log
        const { error } = await supabase
          .from('corset_logs')
          .update({ wore_it: woreIt })
          .eq('id', todayLog.id);
        
        if (error) throw error;
      } else {
        // Create new log
        const { error } = await supabase
          .from('corset_logs')
          .insert({
            user_id: user.id,
            date: today,
            wore_it: woreIt
          });
        
        if (error) throw error;
      }
      
      // Reload today's log
      await loadTodayLog(user.id);
    } catch (error) {
      console.error('Error logging corset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmojiForDate = (date) => {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Emojis por mes
    const monthlyEmojis = [
      '❄️', '💝', '🌸', '🌷', '🌺', '☀️',
      '🏖️', '🌻', '🍂', '🎃', '🍁', '🎄'
    ];
    
    // Emojis especiales para días específicos
    const specialDays = {
      '1-1': '🎆', // Año nuevo
      '2-14': '💕', // San Valentín
      '3-17': '🍀', // San Patricio
      '4-1': '🤪', // Día de los inocentes
      '5-5': '🌮', // Cinco de mayo
      '6-21': '☀️', // Solsticio de verano
      '7-4': '🎆', // Independencia USA
      '10-31': '🎃', // Halloween
      '12-25': '🎄', // Navidad
      '12-31': '🎊' // Nochevieja
    };
    
    const specialKey = `${month + 1}-${day}`;
    if (specialDays[specialKey]) {
      return specialDays[specialKey];
    }
    
    return monthlyEmojis[month];
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="min-h-screen p-2 pb-24">
      <section className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <Menubar />
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 md:space-y-8 px-4">
          {/* Calendario de Emoji */}
          <div className="text-center space-y-3 md:space-y-4">
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl animate-bounce">
              {getEmojiForDate(currentDate)}
            </div>
            <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-primary">
              {formatDate(currentDate)}
            </div>
            <div className="text-lg md:text-lg text-base-content/70">
              ¿Usaste el corset {userSettings?.goal_hours_per_day}h hoy?
            </div>
          </div>

          {/* Estado actual */}
          {todayLog && (
            <div className={`text-base md:text-lg font-medium px-4 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 ${
              todayLog.wore_it 
                ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                : 'bg-red-100 text-red-800 border-2 border-red-300'
            }`}>
              {todayLog.wore_it ? (
                <>
                  <Check className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="hidden sm:inline">Sí usaste el corset hoy</span>
                  <span className="sm:hidden">Sí lo usaste</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="hidden sm:inline">No usaste el corset hoy</span>
                  <span className="sm:hidden">No lo usaste</span>
                </>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 md:gap-6 w-full max-w-sm md:max-w-none justify-center">
            <button
              onClick={() => handleLogCorset(false)}
              disabled={isLoading}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-full text-white font-bold text-lg md:text-lg transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
              }`}
            >
              <X className="w-6 h-6 md:w-6 md:h-6" />
              No
            </button>
            
            <button
              onClick={() => handleLogCorset(true)}
              disabled={isLoading}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-full text-white font-bold text-lg md:text-lg transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'
              }`}
            >
              <Check className="w-6 h-6 md:w-6 md:h-6" />
              Sí
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-base md:text-base text-base-content/70">
              <span className="loading loading-spinner loading-sm"></span>
              Guardando...
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
